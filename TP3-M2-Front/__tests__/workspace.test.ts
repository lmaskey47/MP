import { Workspace } from '../src/services/workspace';
import {
  emptySnapshot,
  type Snapshot,
  type Operation,
} from '../src/types/mobile';
import { request, RequestError } from '../src/services/client';
import * as storage from '../src/storage/mobile';

test('a stalled network request does not block a second scan', async () => {
  const w = await setup();
  await w.enqueue('item', item, 'scanned', {});
  let release: (value: unknown) => void = () => {};
  api.mockImplementation(
    () =>
      new Promise(resolve => {
        release = resolve;
      }),
  );
  const sending = w.sync();
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  await w.enqueue('item', item, 'scanned', {});
  expect(persisted).toHaveLength(2);
  release({ entity: item });
  await sending;
  expect(persisted).toHaveLength(1);
});

test('a stale refresh cannot overwrite a completed action', async () => {
  const w = await setup();
  await w.enqueue('item', item, 'status', { status: 'delivered' });
  let release: (value: unknown) => void = () => {};
  api.mockImplementation((path: string) =>
    path === '/mobile/bootstrap'
      ? new Promise(resolve => {
          release = resolve;
        })
      : Promise.resolve({ entity: { ...item, status: 'delivered' } }),
  );
  const refreshing = w.refresh();
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  await w.sync();
  release({ ...emptySnapshot, items: [item] });
  await refreshing;
  expect(w.state.data.items[0].status).toBe('delivered');
});
jest.mock('../src/services/client', () => ({
  request: jest.fn(),
  sessionClient: { get: () => ({ user: { id: 'owner' } }) },
  RequestError: class extends Error {
    status: number;
    details: unknown;
    constructor(code: number, text: string, info?: unknown) {
      super(text);
      this.status = code;
      this.details = info;
    }
  },
}));
jest.mock('../src/storage/mobile', () => ({
  readSnapshot: jest.fn(),
  saveSnapshot: jest.fn(),
  readOperations: jest.fn(),
  saveOperation: jest.fn(),
  removeOperation: jest.fn(),
}));
const api = request as jest.Mock;
const item = {
  _id: '123456789012345678901234',
  eventId: 'event',
  updatedAt: '2026-09-01T10:00:00.000Z',
  qrCode: 'QR1',
  label: 'Radio',
  category: 'radio',
  status: 'available',
  carbonKg: 1,
  offlineVersion: 0,
};
let snapshot: Snapshot;
let persisted: Operation[];
beforeEach(() => {
  jest.clearAllMocks();
  snapshot = { ...emptySnapshot, items: [{ ...item } as never] };
  persisted = [];
  (storage.readSnapshot as jest.Mock).mockImplementation(async () => snapshot);
  (storage.readOperations as jest.Mock).mockImplementation(async () =>
    persisted.map(o => ({ ...o })),
  );
  (storage.saveSnapshot as jest.Mock).mockImplementation(
    async (_owner, data) => {
      snapshot = data;
    },
  );
  (storage.saveOperation as jest.Mock).mockImplementation(
    async (_owner, op) => {
      persisted = [...persisted.filter(o => o.id !== op.id), { ...op }];
    },
  );
  (storage.removeOperation as jest.Mock).mockImplementation(
    async (_owner, id) => {
      persisted = persisted.filter(o => o.id !== id);
    },
  );
});
async function setup() {
  const w = new Workspace('owner');
  await w.initialise();
  return w;
}
test('offline action persists before optimistic display', async () => {
  const w = await setup();
  await w.enqueue('item', item, 'status', { status: 'delivered' });
  expect(persisted).toHaveLength(1);
  expect(w.state.data.items[0].status).toBe('delivered');
  expect(api).not.toHaveBeenCalled();
});
test('restarts restore pending actions', async () => {
  const w = await setup();
  await w.enqueue('item', item, 'status', { status: 'delivered' });
  const restored = await setup();
  expect(restored.state.data.items[0].status).toBe('delivered');
  expect(restored.state.operations).toHaveLength(1);
});
test('network failure keeps action pending for retry', async () => {
  const w = await setup();
  await w.enqueue('item', item, 'scanned', {});
  api.mockRejectedValue(new TypeError('Network request failed'));
  await w.sync();
  expect(persisted[0].state).toBe('pending');
  expect(w.state.busy).toBe(false);
});
test('409 rolls back dependent optimistic changes', async () => {
  const w = await setup();
  await w.enqueue('item', item, 'status', { status: 'delivered' });
  await w.enqueue('item', item, 'status', { status: 'maintenance' });
  api.mockRejectedValue(
    new RequestError(409, 'Conflict', {
      current: {
        ...item,
        status: 'damaged',
        updatedAt: '2026-09-01T11:00:00.000Z',
      },
    }),
  );
  await w.sync();
  expect(api).toHaveBeenCalledTimes(1);
  expect(w.state.operations[0].state).toBe('conflict');
  expect(w.state.data.items[0].status).toBe('damaged');
});
test('accepted action rebases its successor', async () => {
  const w = await setup();
  await w.enqueue('item', item, 'scanned', {});
  await w.enqueue('item', item, 'status', { status: 'delivered' });
  api
    .mockResolvedValueOnce({
      entity: { ...item, updatedAt: '2026-09-01T11:00:00.000Z' },
    })
    .mockResolvedValueOnce({
      entity: {
        ...item,
        status: 'delivered',
        updatedAt: '2026-09-01T12:00:00.000Z',
      },
    });
  await w.sync();
  expect(JSON.parse(api.mock.calls[1][1].body).expected).toBe(
    '2026-09-01T11:00:00.000Z',
  );
  expect(persisted).toHaveLength(0);
  expect(w.state.data.items[0].status).toBe('delivered');
});
test('concurrent sync calls share a single sender', async () => {
  const w = await setup();
  await w.enqueue('item', item, 'scanned', {});
  api.mockResolvedValue({ entity: item });
  await Promise.all([w.sync(), w.sync()]);
  expect(api).toHaveBeenCalledTimes(1);
});
test('permanent rejection rolls back UI', async () => {
  const w = await setup();
  await w.enqueue('item', item, 'status', { status: 'delivered' });
  api.mockRejectedValue(new RequestError(403, 'Forbidden'));
  await w.sync();
  expect(w.state.operations[0].state).toBe('failed');
  expect(w.state.data.items[0].status).toBe('available');
});
test('explicit conflict resolution keeps local change with latest revision', async () => {
  const w = await setup();
  const op = await w.enqueue('item', item, 'status', { status: 'delivered' });
  api.mockRejectedValue(
    new RequestError(409, 'Conflict', {
      current: { ...item, updatedAt: '2026-09-01T11:00:00.000Z' },
    }),
  );
  await w.sync();
  await w.resolve(op.id, true);
  expect(persisted[0].expected).toBe('2026-09-01T11:00:00.000Z');
  expect(w.state.data.items[0].status).toBe('delivered');
});
test('keeping server removes local change', async () => {
  const w = await setup();
  const op = await w.enqueue('item', item, 'status', { status: 'delivered' });
  api.mockRejectedValue(
    new RequestError(409, 'Conflict', {
      current: { ...item, status: 'damaged' },
    }),
  );
  await w.sync();
  await w.resolve(op.id, false);
  expect(persisted).toHaveLength(0);
  expect(w.state.data.items[0].status).toBe('damaged');
});
test('missing revision is rejected before queue insertion', async () => {
  const w = await setup();
  await expect(
    w.enqueue('item', { ...item, updatedAt: '' }, 'scanned', {}),
  ).rejects.toThrow('Rechargez');
  expect(persisted).toHaveLength(0);
});
