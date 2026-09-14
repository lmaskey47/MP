import SQLite, { type SQLiteDatabase } from 'react-native-sqlite-storage';
import type { Snapshot, Operation } from '../types/mobile';
import { emptySnapshot } from '../types/mobile';
SQLite.enablePromise(true);
let connection: Promise<SQLiteDatabase> | undefined;
function db() {
  if (!connection)
    connection = (async () => {
      const value = await SQLite.openDatabase({
        name: 'logichain-mobile-v2.db',
        location: 'default',
      });
      await value.executeSql(
        'CREATE TABLE IF NOT EXISTS records (owner TEXT, kind TEXT, id TEXT, event_id TEXT, zone TEXT, data TEXT, PRIMARY KEY(owner,kind,id))',
      );
      await value.executeSql(
        'CREATE INDEX IF NOT EXISTS records_sector ON records(owner,event_id,zone)',
      );
      await value.executeSql(
        'CREATE TABLE IF NOT EXISTS operations (owner TEXT, id TEXT, data TEXT, PRIMARY KEY(owner,id))',
      );
      return value;
    })().catch(error => {
      connection = undefined;
      throw error;
    });
  return connection;
}
export async function readSnapshot(owner: string): Promise<Snapshot> {
  const value: Snapshot = { ...emptySnapshot };
  for (const key of Object.keys(value) as (keyof Snapshot)[]) value[key] = [];
  const [result] = await (
    await db()
  ).executeSql('SELECT kind,data FROM records WHERE owner=?', [owner]);
  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows.item(i);
    (value[row.kind as keyof Snapshot] as unknown[]).push(JSON.parse(row.data));
  }
  return value;
}
export async function saveSnapshot(owner: string, data: Snapshot) {
  const statements: Array<[string, unknown[]]> = [
    ['DELETE FROM records WHERE owner=?', [owner]],
  ];
  for (const [kind, entries] of Object.entries(data))
    for (const entry of entries)
      statements.push([
        'INSERT INTO records(owner,kind,id,event_id,zone,data) VALUES(?,?,?,?,?,?)',
        [
          owner,
          kind,
          entry._id,
          'eventId' in entry ? entry.eventId : '',
          'zoneCode' in entry ? entry.zoneCode : '',
          JSON.stringify(entry),
        ],
      ]);
  // The package implements sqlBatch but its community declarations omit it.
  const connectionWithBatch = (await db()) as SQLiteDatabase & {
    sqlBatch(statements: Array<[string, unknown[]]>): Promise<void>;
  };
  await connectionWithBatch.sqlBatch(statements);
}
export async function readOperations(owner: string): Promise<Operation[]> {
  const [rows] = await (
    await db()
  ).executeSql('SELECT data FROM operations WHERE owner=? ORDER BY rowid', [
    owner,
  ]);
  return Array.from({ length: rows.rows.length }, (_, i) =>
    JSON.parse(rows.rows.item(i).data),
  );
}
export async function saveOperation(owner: string, op: Operation) {
  await (
    await db()
  ).executeSql(
    'INSERT OR REPLACE INTO operations(owner,id,data) VALUES(?,?,?)',
    [owner, op.id, JSON.stringify(op)],
  );
}
export async function removeOperation(owner: string, id: string) {
  await (
    await db()
  ).executeSql('DELETE FROM operations WHERE owner=? AND id=?', [owner, id]);
}
export async function sectorItems(
  owner: string,
  eventId: string,
  zone: string,
) {
  const [rows] = await (
    await db()
  ).executeSql(
    "SELECT i.data, e.data AS event FROM records i JOIN records e ON e.owner=i.owner AND e.kind='events' AND e.id=i.event_id WHERE i.owner=? AND i.kind='items' AND i.event_id=? AND i.zone=?",
    [owner, eventId, zone],
  );
  return Array.from({ length: rows.rows.length }, (_, i) =>
    JSON.parse(rows.rows.item(i).data),
  );
}
