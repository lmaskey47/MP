import type { Snapshot, Operation, Entity } from '../types/mobile';
export function optimistic(
  snapshot: Snapshot,
  operations: Operation[],
): Snapshot {
  const next: Snapshot = {
    ...snapshot,
    items: [...snapshot.items],
    tasks: [...snapshot.tasks],
    deliveries: [...snapshot.deliveries],
    anomalies: [...snapshot.anomalies],
  };
  const blocked = new Set(
    operations
      .filter(value => value.state !== 'pending')
      .map(value => value.kind + value.entityId),
  );
  for (const op of operations.filter(
    value =>
      value.state === 'pending' && !blocked.has(value.kind + value.entityId),
  )) {
    if (op.kind === 'anomaly') continue;
    const key =
      op.kind === 'item'
        ? 'items'
        : op.kind === 'task'
        ? 'tasks'
        : 'deliveries';
    next[key] = next[key].map(entity =>
      entity._id === op.entityId ? { ...entity, ...op.data } : entity,
    ) as never;
  }
  return next;
}
export function replaceEntity(
  snapshot: Snapshot,
  kind: Operation['kind'],
  entity: Entity,
): Snapshot {
  const key =
    kind === 'item'
      ? 'items'
      : kind === 'task'
      ? 'tasks'
      : kind === 'delivery'
      ? 'deliveries'
      : 'anomalies';
  const values = snapshot[key] as Entity[];
  return {
    ...snapshot,
    [key]: values.some(value => value._id === entity._id)
      ? values.map(value => (value._id === entity._id ? entity : value))
      : [...values, entity],
  };
}
export function validateAction(
  kind: Operation['kind'],
  action: string,
  data: Record<string, unknown>,
) {
  if (kind === 'anomaly') {
    const p = data.location as { coordinates?: number[] } | undefined;
    if (
      typeof data.message !== 'string' ||
      !data.message.trim() ||
      data.message.length > 2000
    )
      throw new Error('Décrivez le problème (1 à 2000 caractères).');
    if (!['low', 'medium', 'high', 'critical'].includes(String(data.severity)))
      throw new Error('Sévérité invalide.');
    if (
      !p?.coordinates ||
      p.coordinates.length !== 2 ||
      !p.coordinates.every(Number.isFinite) ||
      Math.abs(p.coordinates[0]) > 180 ||
      Math.abs(p.coordinates[1]) > 90
    )
      throw new Error('Capturez une position GPS valide.');
  }
  if (action === 'moved' && !String(data.zoneCode ?? '').trim())
    throw new Error('Choisissez une zone.');
  if (
    action === 'transferred' &&
    !/^[a-f0-9]{24}$/i.test(String(data.responsibleUserId))
  )
    throw new Error('Choisissez un responsable.');
}
