import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { DEVELOPER_ID } from './config.js';
import { users, games, sessions, settings, achievements, activity } from '../schema.js';

// ---------------------------------------------------------------------------
// Developer storage console — shared metadata + operations used by the Mini App
// endpoints. Everything here is gated by assertDev() at the endpoint layer.
// ---------------------------------------------------------------------------

/** table name -> { table, pk, columns: [{ name, type }] } */
const REGISTRY = {
  users: {
    table: users,
    pk: 'id',
    columns: [
      { name: 'id', type: 'int' }, { name: 'tgId', type: 'int' },
      { name: 'name', type: 'text' }, { name: 'username', type: 'text' },
      { name: 'lang', type: 'text' }, { name: 'coins', type: 'int' },
      { name: 'gems', type: 'int' }, { name: 'xp', type: 'int' },
      { name: 'level', type: 'int' }, { name: 'plays', type: 'int' },
      { name: 'wins', type: 'int' }, { name: 'losses', type: 'int' },
      { name: 'streak', type: 'int' }, { name: 'bestStreak', type: 'int' },
      { name: 'dailyStreak', type: 'int' }, { name: 'isBan', type: 'bool' },
      { name: 'isPremium', type: 'bool' }, { name: 'referredBy', type: 'int' },
      { name: 'lastDaily', type: 'ts' }, { name: 'createdAt', type: 'ts' },
      { name: 'lastSeen', type: 'ts' },
    ],
  },
  games: {
    table: games,
    pk: 'id',
    columns: [
      { name: 'id', type: 'int' }, { name: 'userId', type: 'int' },
      { name: 'game', type: 'text' }, { name: 'bet', type: 'int' },
      { name: 'result', type: 'text' }, { name: 'reward', type: 'int' },
      { name: 'createdAt', type: 'ts' },
    ],
  },
  sessions: {
    table: sessions,
    pk: 'chatId',
    columns: [
      { name: 'chatId', type: 'int' }, { name: 'userId', type: 'int' },
      { name: 'kind', type: 'text' }, { name: 'data', type: 'json' },
      { name: 'updatedAt', type: 'ts' },
    ],
  },
  settings: {
    table: settings,
    pk: 'key',
    columns: [{ name: 'key', type: 'text' }, { name: 'value', type: 'json' }],
  },
  achievements: {
    table: achievements,
    pk: 'id',
    columns: [
      { name: 'id', type: 'int' }, { name: 'userId', type: 'int' },
      { name: 'code', type: 'text' }, { name: 'createdAt', type: 'ts' },
    ],
  },
  activity: {
    table: activity,
    pk: 'id',
    columns: [
      { name: 'id', type: 'int' }, { name: 'userId', type: 'int' },
      { name: 'action', type: 'text' }, { name: 'detail', type: 'text' },
      { name: 'createdAt', type: 'ts' },
    ],
  },
};

/** Reject any caller that is not the configured developer. */
export function assertDev(ctx) {
  const id = ctx && ctx.initData && ctx.initData.user && ctx.initData.user.id;
  if (id !== DEVELOPER_ID) throw new EndpointError('Developer only', { code: 'FORBIDDEN' });
}

function registry(name) {
  const reg = REGISTRY[name];
  if (!reg) throw new EndpointError('Unknown table', { code: 'UNKNOWN_TABLE' });
  return reg;
}

/** Row counts for every table. */
export async function overview() {
  const out = [];
  for (const [name, reg] of Object.entries(REGISTRY)) {
    out.push({ name, pk: reg.pk, count: await db.$count(reg.table) });
  }
  return out;
}

/** A page of rows plus column metadata. */
export async function getRows(name, limit = 50, offset = 0) {
  const reg = registry(name);
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const off = Math.max(Number(offset) || 0, 0);
  const rows = await db.select().from(reg.table).limit(lim).offset(off).all();
  const total = await db.$count(reg.table);
  return {
    name,
    pk: reg.pk,
    columns: reg.columns,
    limit: lim,
    offset: off,
    total,
    rows: serializeRows(rows, reg),
  };
}

// The platform serializer turns Date values into {}, so timestamp columns are
// converted to ISO strings (editable, and back via coerce('ts', ...)).
function tsToIso(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return new Date(v * 1000).toISOString();
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function serializeRows(rows, reg) {
  const tsCols = reg.columns.filter((c) => c.type === 'ts').map((c) => c.name);
  if (!tsCols.length) return rows;
  return rows.map((r) => {
    const out = { ...r };
    for (const c of tsCols) out[c] = tsToIso(r[c]);
    return out;
  });
}

function coerce(type, v) {
  if (type === 'int') {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) throw new EndpointError('Invalid number', { field: String(v) });
    return Math.trunc(n);
  }
  if (type === 'bool') return v === true || v === 'true' || v === 1 || v === '1';
  if (type === 'json') {
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch { throw new EndpointError('Invalid JSON'); }
    }
    return v;
  }
  if (type === 'ts') {
    if (v === '' || v === null || v === undefined) return null;
    const d = typeof v === 'number' ? new Date(v * 1000) : new Date(v);
    if (Number.isNaN(d.getTime())) throw new EndpointError('Invalid date', { field: String(v) });
    return d;
  }
  return v === undefined || v === null ? null : String(v);
}

/** Coerce a Mini App primary-key string back to the column's real type. */
function pkCoerce(reg, pkValue) {
  const col = reg.columns.find((c) => c.name === reg.pk);
  return coerce(col ? col.type : 'text', pkValue);
}

/** Update one row; the primary key is never editable. */
export async function updateRow(name, pkValue, values) {
  const reg = registry(name);
  const patch = {};
  for (const col of reg.columns) {
    if (col.name === reg.pk) continue;
    if (values && Object.prototype.hasOwnProperty.call(values, col.name)) {
      patch[col.name] = coerce(col.type, values[col.name]);
    }
  }
  if (!Object.keys(patch).length) throw new EndpointError('No editable fields supplied');
  await db.update(reg.table).set(patch).where(eq(reg.table[reg.pk], pkCoerce(reg, pkValue))).run();
  return { ok: true, name, pk: reg.pk, updated: Object.keys(patch) };
}

// DELETE ... WHERE does not persist on this platform, so a single row is removed
// by rewriting the table (read, delete-all, re-insert everything else).
export async function deleteRow(name, pkValue) {
  const reg = registry(name);
  const pk = pkCoerce(reg, pkValue);
  const all = await db.select().from(reg.table).all();
  const keep = all.filter((r) => r[reg.pk] !== pk);
  if (keep.length === all.length) throw new EndpointError('Row not found', { pk: pkValue });
  await db.delete(reg.table).run();
  if (keep.length) await db.insert(reg.table).values(keep).run();
  return { ok: true, name, deleted: all.length - keep.length, remaining: keep.length };
}

/** Remove every row from a table (delete-all persists reliably). */
export async function clearTable(name) {
  const reg = registry(name);
  const before = await db.$count(reg.table);
  await db.delete(reg.table).run();
  return { ok: true, name, cleared: before };
}
