import type { Snapshot, Operation, Entity, Session } from '../types/mobile';
import { emptySnapshot } from '../types/mobile';
import {
  readSnapshot,
  saveSnapshot,
  readOperations,
  saveOperation,
  removeOperation,
} from '../storage/mobile';
import { request, RequestError, sessionClient } from './client';
import { optimistic, replaceEntity, validateAction } from './operations';

export class Workspace {
  private snapshot: Snapshot = emptySnapshot;
  private ops: Operation[] = [];
  private listeners = new Set<() => void>();
  private chain: Promise<unknown> = Promise.resolve();
  private syncing: Promise<void> | null = null;
  private refreshing: Promise<void> | null = null;
  private generation = 0;
  state = {
    data: emptySnapshot,
    operations: [] as Operation[],
    busy: false,
    error: '',
    ready: false,
  };
  constructor(public readonly owner: string) {}
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getState = () => this.state;
  private emit(update: Partial<typeof this.state> = {}) {
    this.state = {
      ...this.state,
      data: optimistic(this.snapshot, this.ops),
      operations: [...this.ops],
      ...update,
    };
    this.listeners.forEach(fn => fn());
  }
  // Only local writes use this lock. A slow HTTP request never blocks a scan.
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const result = this.chain.then(work, work);
    this.chain = result.catch(() => {});
    return result;
  }
  initialise = () =>
    this.serial(async () => {
      try {
        this.snapshot = await readSnapshot(this.owner);
        this.ops = await readOperations(this.owner);
        this.emit({ ready: true });
      } catch (e) {
        this.emit({ error: message(e), ready: true });
      }
    });
  refresh = (): Promise<void> => {
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      await this.chain;
      if (sessionClient.get()?.user.id !== this.owner) return;
      const revision = this.generation;
      try {
        const data = await request<Snapshot>('/mobile/bootstrap');
        await this.serial(async () => {
          if (revision !== this.generation) return;
          await saveSnapshot(this.owner, data);
          this.snapshot = data;
          this.emit({ error: '' });
        });
      } catch (e) {
        this.emit({ error: message(e) });
        throw e;
      }
    })().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  };
  enqueue = (
    kind: Operation['kind'],
    entity: Entity,
    action: string,
    data: Record<string, unknown>,
  ) =>
    this.serial(async () => {
      validateAction(kind, action, data);
      const id =
        Date.now().toString(36) +
        '-' +
        Math.random().toString(36).slice(2) +
        '-' +
        Math.random().toString(36).slice(2);
      const op: Operation = {
        id,
        kind,
        entityId: entity._id,
        expected: entity.updatedAt,
        action,
        data,
        state: 'pending',
        createdAt: new Date().toISOString(),
      };
      if (!op.expected)
        throw new Error('Rechargez les données avant cette action.');
      await saveOperation(this.owner, op);
      this.ops.push(op);
      this.emit();
      return op;
    });
  sync = (): Promise<void> => {
    if (this.syncing) return this.syncing;
    this.syncing = this.sendPending().finally(() => {
      this.syncing = null;
    });
    return this.syncing;
  };
  private async sendPending() {
    await this.chain;
    this.emit({ busy: true });
    try {
      for (const op of [...this.ops]) {
        if (sessionClient.get()?.user.id !== this.owner) break;
        if (
          op.state !== 'pending' ||
          this.ops.some(
            other =>
              other.entityId === op.entityId &&
              other.kind === op.kind &&
              other.state !== 'pending',
          )
        )
          continue;
        try {
          const { entity } = await request<{ entity: Entity }>(
            '/mobile/operations',
            { method: 'POST', body: JSON.stringify(op) },
          );
          await this.serial(async () => {
            this.generation++;
            this.snapshot = replaceEntity(this.snapshot, op.kind, entity);
            await saveSnapshot(this.owner, this.snapshot);
            for (const later of this.ops) {
              if (
                later.id !== op.id &&
                later.kind === op.kind &&
                later.entityId === op.entityId &&
                later.state === 'pending'
              ) {
                later.expected = entity.updatedAt;
                await saveOperation(this.owner, later);
              }
            }
            await removeOperation(this.owner, op.id);
            this.ops = this.ops.filter(value => value.id !== op.id);
            this.emit({ error: '' });
          });
        } catch (e) {
          if (
            !(e instanceof RequestError) ||
            e.status >= 500 ||
            e.status === 401 ||
            e.status === 429
          ) {
            this.emit({ error: message(e) });
            break;
          }
          await this.serial(async () => {
            op.state = e.status === 409 ? 'conflict' : 'failed';
            op.error = message(e);
            op.current = e.details?.current;
            if (op.current) {
              this.generation++;
              this.snapshot = replaceEntity(this.snapshot, op.kind, op.current);
            }
            await saveOperation(this.owner, op);
            await saveSnapshot(this.owner, this.snapshot);
            this.emit();
          });
        }
      }
    } finally {
      this.emit({ busy: false });
    }
  }
  resolve = (id: string, keepLocal: boolean) =>
    this.serial(async () => {
      const op = this.ops.find(value => value.id === id);
      if (!op) return;
      if (keepLocal) {
        if (op.current) op.expected = op.current.updatedAt;
        op.state = 'pending';
        op.error = undefined;
        await saveOperation(this.owner, op);
      } else {
        if (op.current)
          for (const later of this.ops) {
            if (
              later.id !== op.id &&
              later.kind === op.kind &&
              later.entityId === op.entityId &&
              later.state === 'pending'
            ) {
              later.expected = op.current.updatedAt;
              await saveOperation(this.owner, later);
            }
          }
        await removeOperation(this.owner, id);
        this.ops = this.ops.filter(value => value.id !== id);
      }
      this.emit();
    });
  async updateEvent(id: string, data: Record<string, unknown>) {
    await request('/events/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    await this.refresh();
  }
  async createEvent(data: Record<string, unknown>) {
    const result = await request<Entity>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const session = sessionClient.get();
    if (session)
      await sessionClient.set(
        await request<Session>(
          '/auth/refresh',
          {
            method: 'POST',
            body: JSON.stringify({ refreshToken: session.refreshToken }),
          },
          false,
        ),
      );
    await this.refresh();
    return result;
  }
  async readNotice(id: string) {
    await request('/users/' + this.owner + '/notifications/' + id + '/read', {
      method: 'PATCH',
    });
    await this.refresh();
  }
}
export const message = (e: unknown) =>
  e instanceof Error ? e.message : 'Une erreur est survenue';
