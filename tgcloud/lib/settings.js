import { db } from 'sdk';
import { eq } from 'sdk/db';
import { settings } from '../schema.js';

const DEFAULTS = {
  maintenance: false,
  disabledGames: [],
  welcome: true,
};

export async function getSetting(key) {
  const row = await db.select().from(settings).where(eq(settings.key, key)).get();
  if (!row || row.value === null || row.value === undefined) return DEFAULTS[key];
  return row.value;
}

export async function setSetting(key, value) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}

export async function isMaintenance() {
  return Boolean(await getSetting('maintenance'));
}

export async function disabledGames() {
  const list = await getSetting('disabledGames');
  return Array.isArray(list) ? list : [];
}

export async function setGameEnabled(gameId, enabled) {
  const list = await disabledGames();
  const next = enabled ? list.filter((g) => g !== gameId) : Array.from(new Set([...list, gameId]));
  await setSetting('disabledGames', next);
  return next;
}

export async function isGameEnabled(gameId) {
  const list = await disabledGames();
  return !list.includes(gameId);
}
