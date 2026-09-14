import type { Event, Item, Task, Anomaly, User } from './api';
export type Entity = {
  _id: string;
  updatedAt: string;
  eventId?: string;
  [key: string]: unknown;
};
export type MobileItem = Item & Entity & { responsibleUserId?: string };
export type MobileTask = Task & Entity;
export type Delivery = Entity & {
  carrierId: string;
  status: 'planned' | 'in_transit' | 'delivered' | 'cancelled';
  routeSheetValidated: boolean;
  stops: Array<{
    zoneCode: string;
    plannedAt: string;
    validatedAt?: string;
    location?: { type: 'Point'; coordinates: [number, number] };
  }>;
};
export type Notice = Entity & {
  title: string;
  message: string;
  critical: boolean;
};
export type Snapshot = {
  events: (Event & Entity)[];
  items: MobileItem[];
  tasks: MobileTask[];
  deliveries: Delivery[];
  anomalies: (Anomaly & Entity)[];
  notifications: Notice[];
  people: { _id: string; name: string; role: string; eventIds: string[] }[];
};
export const emptySnapshot: Snapshot = {
  events: [],
  items: [],
  tasks: [],
  deliveries: [],
  anomalies: [],
  notifications: [],
  people: [],
};
export type Operation = {
  id: string;
  kind: 'item' | 'task' | 'delivery' | 'anomaly';
  entityId: string;
  expected: string;
  action: string;
  data: Record<string, unknown>;
  state: 'pending' | 'conflict' | 'failed';
  error?: string;
  createdAt: string;
  current?: Entity;
};
export type Session = { token: string; refreshToken: string; user: User };
