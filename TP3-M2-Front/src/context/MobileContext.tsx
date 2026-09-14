import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import EventSource from 'react-native-sse';
import { sessionClient } from '../services/client';
import { Workspace } from '../services/workspace';
import { API_BASE_URL } from '../config';
import type { Session } from '../types/mobile';
const Context = createContext<{
  session: Session | null;
  loading: boolean;
  workspace: Workspace | null;
  online: boolean;
  active: boolean;
} | null>(null);
export function MobileProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    sessionClient.listen(setSession);
    sessionClient
      .restore()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
    return () => sessionClient.listen(undefined);
  }, []);
  useEffect(
    () =>
      NetInfo.addEventListener(s =>
        setOnline(Boolean(s.isConnected && s.isInternetReachable !== false)),
      ),
    [],
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', s =>
      setActive(s === 'active'),
    );
    return () => sub.remove();
  }, []);
  const owner = session?.user.id;
  const workspace = useMemo(
    () => (owner ? new Workspace(owner) : null),
    [owner],
  );
  useEffect(() => {
    workspace?.initialise();
  }, [workspace]);
  useEffect(() => {
    if (!workspace || !online || !active) return;
    let count = workspace.state.operations.filter(
      o => o.state === 'pending',
    ).length;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = workspace.subscribe(() => {
      const next = workspace.state.operations.filter(
        o => o.state === 'pending',
      ).length;
      if (next > count) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => workspace.sync().catch(() => {}), 300);
      }
      count = next;
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [workspace, online, active]);
  useEffect(() => {
    if (!workspace || !online || !active) return;
    let closed = false;
    let timer: ReturnType<typeof setTimeout>;
    let delay = 15000;
    const tick = async () => {
      try {
        await workspace.sync();
        if (workspace.state.error || !workspace.state.data.events.length)
          await workspace.refresh();
        delay = 15000;
      } catch {
        delay = Math.min(delay * 2, 120000);
      }
      if (!closed) timer = setTimeout(tick, delay);
    };
    tick();
    return () => {
      closed = true;
      clearTimeout(timer);
    };
  }, [workspace, online, active]);
  useEffect(() => {
    if (!workspace || !session || !online || !active) return;
    const source = new EventSource(API_BASE_URL + '/mobile/stream', {
      headers: { Authorization: 'Bearer ' + session.token },
      pollingInterval: 10000,
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    source.addEventListener('message', () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        workspace.refresh().catch(() => {});
      }, 500);
    });
    source.addEventListener('error', () => {
      workspace.refresh().catch(() => {});
    });
    return () => {
      source.removeAllEventListeners();
      source.close();
      if (timer) clearTimeout(timer);
    };
  }, [workspace, session, online, active]);
  return (
    <Context.Provider value={{ session, loading, workspace, online, active }}>
      {children}
    </Context.Provider>
  );
}
export function useMobile() {
  const value = useContext(Context);
  if (!value) throw new Error('MobileProvider absent');
  return value;
}
export function useWorkspace() {
  const { workspace, ...context } = useMobile();
  if (!workspace) throw new Error('Session absente');
  const state = useSyncExternalStore(
    workspace.subscribe,
    workspace.getState,
    workspace.getState,
  );
  return {
    ...context,
    ...state,
    workspace,
    manager: ['admin', 'logistic_manager'].includes(context.session!.user.role),
  };
}
