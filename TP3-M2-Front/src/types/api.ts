export type UserRole =
  | 'admin'
  | 'logistic_manager'
  | 'field_agent'
  | 'provider';
export type TaskStatus = 'planned' | 'in_progress' | 'done' | 'blocked';
export type ItemStatus =
  | 'available'
  | 'in_transit'
  | 'delivered'
  | 'maintenance'
  | 'lost'
  | 'damaged';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  eventIds: string[];
}
export interface AuthResponse {
  token: string;
  user: User;
}
export interface Event {
  _id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'closed';
  startsAt: string;
  endsAt: string;
  location: GeoPoint;
  zones: EventZone[];
  version: number;
}
export interface EventZone {
  code: string;
  label: string;
  kind: string;
  boundary: { type: 'Polygon'; coordinates: number[][][] };
}
export interface Task {
  _id: string;
  eventId: string;
  assigneeId: string;
  title: string;
  description?: string;
  zoneCode?: string;
  itemIds: string[];
  status: TaskStatus;
  dueAt?: string;
  version: number;
}
export interface Item {
  _id: string;
  eventId: string;
  qrCode: string;
  label: string;
  category: string;
  status: ItemStatus;
  zoneCode?: string;
  carbonKg: number;
  offlineVersion: number;
}
export interface Anomaly {
  _id: string;
  eventId: string;
  itemId: string;
  reporterId: string;
  severity: AnomalySeverity;
  status: 'open' | 'investigating' | 'resolved';
  message: string;
  location: GeoPoint;
}
export interface DashboardKpis {
  totalItems?: number;
  carbonKg?: number;
  itemStatus?: Array<{ _id: string; count: number }>;
  openAnomalies?: number;
  pendingTasks?: number;
  [key: string]: unknown;
}
export type SyncAction = 'scanned' | 'moved' | 'transferred' | 'maintenance';
export interface SyncOperation {
  clientOperationId: string;
  itemId: string;
  expectedOfflineVersion: number;
  action: SyncAction;
  actorId: string;
  payload: Record<string, unknown>;
}
export interface QueueEntry extends SyncOperation {
  state: 'pending' | 'conflict' | 'failed';
  error?: string;
  createdAt: string;
}
export interface PendingAnomaly {
  id: string;
  eventId: string;
  itemId: string;
  reporterId: string;
  severity: AnomalySeverity;
  message: string;
  location: GeoPoint;
  state: 'pending' | 'failed';
  error?: string;
  createdAt: string;
}

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Tasks: undefined;
  Scan: undefined;
  Anomaly: { itemId?: string } | undefined;
  Sync: undefined;
  Items: undefined;
  Deliveries: undefined;
  Alerts: undefined;
  Map: undefined;
  Manage: undefined;
};
