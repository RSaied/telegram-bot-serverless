import { db } from 'sdk';
import { eq, and } from 'sdk/db';
import { achievements } from '../schema.js';

// Each achievement has a code, a display name (ar/en) and an emoji.
export const ACHIEVEMENTS = [
  { code: 'first_win', emoji: '🥇', ar: 'أول فوز', en: 'First win' },
  { code: 'ten_wins', emoji: '🏆', ar: '10 انتصارات', en: '10 wins' },
  { code: 'fifty_wins', emoji: '👑', ar: '50 انتصارًا', en: '50 wins' },
  { code: 'rich', emoji: '💰', ar: 'ثري (10 آلاف عملة)', en: 'Rich (10k coins)' },
  { code: 'veteran', emoji: '🎖️', ar: 'لاعب مخضرم (100 لعبة)', en: 'Veteran (100 games)' },
  { code: 'streak5', emoji: '🔥', ar: 'سلسلة 5', en: '5-win streak' },
  { code: 'level5', emoji: '⭐', ar: 'المستوى 5', en: 'Level 5' },
  { code: 'premium', emoji: '💎', ar: 'بريميوم', en: 'Premium' },
  { code: 'referrer', emoji: '👥', ar: 'داعٍ (5 إحالات)', en: 'Referrer (5 invites)' },
];

export function achDef(code) {
  return ACHIEVEMENTS.find((a) => a.code === code);
}

export async function hasAchievement(userId, code) {
  const row = await db
    .select()
    .from(achievements)
    .where(and(eq(achievements.userId, userId), eq(achievements.code, code)))
    .get();
  return Boolean(row);
}

/** Unlock if not already unlocked. Returns the definition if newly unlocked, else null. */
export async function unlock(userId, code) {
  if (await hasAchievement(userId, code)) return null;
  await db.insert(achievements).values({ userId, code }).run();
  return achDef(code);
}

export async function listUnlocked(userId) {
  const rows = await db.select().from(achievements).where(eq(achievements.userId, userId)).all();
  return rows.map((r) => r.code);
}

/**
 * Check the common achievements after a game. Returns an array of newly unlocked defs.
 * `user` is the row before the game counters were updated.
 */
export async function checkAfterGame(user, { reward = 0, won = false } = {}) {
  const gained = [];
  const wins = (user.wins || 0) + (won ? 1 : 0);
  const coins = user.coins || 0;
  const plays = (user.plays || 0) + 1;
  const streak = won ? (user.streak || 0) + 1 : 0;
  const level = user.level || 1;

  if (won && wins >= 1) gained.push(await unlock(user.id, 'first_win'));
  if (won && wins >= 10) gained.push(await unlock(user.id, 'ten_wins'));
  if (won && wins >= 50) gained.push(await unlock(user.id, 'fifty_wins'));
  if (coins + reward >= 10000) gained.push(await unlock(user.id, 'rich'));
  if (plays >= 100) gained.push(await unlock(user.id, 'veteran'));
  if (won && streak >= 5) gained.push(await unlock(user.id, 'streak5'));
  if (level >= 5) gained.push(await unlock(user.id, 'level5'));
  if (user.isPremium) gained.push(await unlock(user.id, 'premium'));

  return gained.filter(Boolean);
}
