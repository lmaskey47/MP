import * as Keychain from 'react-native-keychain';
import { API_BASE_URL } from '../config';
import type { Session } from '../types/mobile';
const key = '@logichain/session-v2';
let session: Session | null = null;
let refresh: Promise<void> | null = null;
let changed: ((value: Session | null) => void) | undefined;
export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { current?: import('../types/mobile').Entity },
  ) {
    super(message);
  }
}
export const sessionClient = {
  get: () => session,
  listen: (callback: typeof changed) => {
    changed = callback;
  },
  async restore() {
    const raw = await Keychain.getGenericPassword({ service: key });
    try {
      session = raw ? JSON.parse(raw.password) : null;
    } catch {
      session = null;
      await Keychain.resetGenericPassword({ service: key });
    }
    return session;
  },
  async set(value: Session | null) {
    if (value) {
      const saved = await Keychain.setGenericPassword(
        value.user.id,
        JSON.stringify(value),
        { service: key },
      );
      if (!saved) throw new Error('Impossible de sécuriser la session.');
    } else await Keychain.resetGenericPassword({ service: key });
    session = value;
    changed?.(value);
  },
  async login(email: string, password: string) {
    const value = await request<Session>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      },
      false,
    );
    await this.set(value);
  },
  async logout() {
    const token = session?.refreshToken;
    if (token)
      await request(
        '/auth/logout',
        { method: 'POST', body: JSON.stringify({ refreshToken: token }) },
        false,
      ).catch(() => {});
    await this.set(null);
  },
};
export async function request<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(API_BASE_URL + path, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: 'Bearer ' + session.token } : {}),
        ...init.headers,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
  if (response.status === 401 && retry && session?.refreshToken) {
    if (!refresh)
      refresh = (async () => {
        try {
          const value = await request<Session>(
            '/auth/refresh',
            {
              method: 'POST',
              body: JSON.stringify({ refreshToken: session!.refreshToken }),
            },
            false,
          );
          await sessionClient.set(value);
        } catch (e) {
          if (e instanceof RequestError && e.status === 401)
            await sessionClient.set(null);
          throw e;
        } finally {
          refresh = null;
        }
      })();
    await refresh;
    return request<T>(path, init, false);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new RequestError(
      response.status,
      body.message ?? body.error ?? 'Service indisponible',
      body.details,
    );
  return body as T;
}
