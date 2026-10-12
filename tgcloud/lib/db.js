import { db } from 'sdk';
import { eq, and, desc, sql, inArray } from 'sdk/db';
import { users, games, sessions, activity } from '../schema.js';
import { START_COINS, XP_PER_LEVEL, XP_PER_WIN, XP_PER_PLAY, DEVELOPER_ID, DEFAULT_LANG, CURRENCY } from './config.js';
import { levelFromXp, escapeMd } from './format.js';
import { t, detectLang } from './i18n.js';
import { sendMessage } from './ui.js';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getUser(tgId) {
  return db.select().from(users).where(eq(users.tgId, tgId)).get();
}

export async function getUserById(id) {
  return db.select().from(users).where(eq(users.id, id)).get();
}

/** Notify the developer the first time a user is registered (any entry point). */
async function notifyNewUser(row, from) {
  try {
    if (!row || from?.is_bot || from?.id === DEVELOPER_ID) return;
    const devUser = await getUser(DEVELOPER_ID);
    const devLang = devUser ? devUser.lang || DEFAULT_LANG : DEFAULT_LANG;
    await sendMessage(
      DEVELOPER_ID,
      t(devLang, 'dev_new_user', {
        name: escapeMd(row.name || from?.first_name || row.tgId),
        id: row.tgId,
        username: row.username ? `@${escapeMd(row.username)}` : '—',
        coins: row.coins,
        currency: CURRENCY,
      }),
    );
  } catch (_) {
    // dev blocked the bot / rate limited — ignore
  }
}

/** Insert the user if missing, otherwise refresh name/username/last_seen. */
export async function ensureUser(from) {
  const existing = await getUser(from.id);
  const name = from.first_name || from.username || null;
  const lang = detectLang(from.language_code);
  const [row] = await db
    .insert(users)
    .values({
      tgId: from.id,
      name,
      username: from.username ?? null,
      coins: START_COINS,
      lang,
    })
    .onConflictDoUpdate({
      target: users.tgId,
      set: {
        name,
        username: from.username ?? null,
        lang: sql`coalesce(${users.lang}, ${lang})`,
        lastSeen: sql`(unixepoch())`,
      },
    })
    .returning()
    .run();
  if (!existing) await notifyNewUser(row, from);
  return row;
}

export async function addCoins(tgId, amount) {
  await db
    .update(users)
    .set({ coins: sql`${users.coins} + ${amount}` })
    .where(eq(users.tgId, tgId))
    .run();
}

export async function addGems(tgId, amount) {
  await db
    .update(users)
    .set({ gems: sql`${users.gems} + ${amount}` })
    .where(eq(users.tgId, tgId))
    .run();
}

/** Deduct coins but never below zero. Returns the amount actually deducted. */
export async function deductCoins(tgId, amount) {
  const a = Math.max(0, Math.floor(amount));
  if (!a) return 0;
  const row = await db.select().from(users).where(eq(users.tgId, tgId)).get();
  const current = row ? row.coins : 0;
  const applied = Math.min(a, Math.max(current, 0));
  if (applied > 0) {
    await db
      .update(users)
      .set({ coins: sql`${users.coins} - ${applied}` })
      .where(eq(users.tgId, tgId))
      .run();
  }
  return applied;
}

export async function setBan(tgId, banned) {
  await db.update(users).set({ isBan: banned }).where(eq(users.tgId, tgId)).run();
}

export async function setPremium(tgId, premium) {
  await db.update(users).set({ isPremium: premium }).where(eq(users.tgId, tgId)).run();
}

export async function setLang(tgId, lang) {
  await db.update(users).set({ lang }).where(eq(users.tgId, tgId)).run();
}

export async function setReferredBy(tgId, referrerId) {
  await db.update(users).set({ referredBy: referrerId }).where(eq(users.tgId, tgId)).run();
}

export async function setDaily(tgId, when) {
  await db.update(users).set({ lastDaily: when }).where(eq(users.tgId, tgId)).run();
}

export async function setDailyStreak(tgId, streak) {
  await db.update(users).set({ dailyStreak: streak }).where(eq(users.tgId, tgId)).run();
}

/** Award XP and roll the level up if the threshold is crossed. Returns the new level. */
export async function awardXp(tgId, amount) {
  const user = await getUser(tgId);
  if (!user) return 1;
  const newXp = (user.xp || 0) + amount;
  const { level } = levelFromXp(newXp, XP_PER_LEVEL);
  await db.update(users).set({ xp: newXp, level }).where(eq(users.tgId, tgId)).run();
  return level;
}

// ---------------------------------------------------------------------------
// Game results
// ---------------------------------------------------------------------------

/**
 * Record a finished round: persists the row and updates counters/XP.
 * Games are free to play; the win reward is paid by the games kit,
 * so this function does NOT touch balances.
 * result is 'win' | 'lose' | 'draw'.
 */
export async function recordGame(tgId, game, result, reward) {
  await db.insert(games).values({ userId: tgId, game, result, reward }).run();

  if (result === 'win') {
    await db
      .update(users)
      .set({
        plays: sql`${users.plays} + 1`,
        wins: sql`${users.wins} + 1`,
        streak: sql`${users.streak} + 1`,
        bestStreak: sql`CASE WHEN ${users.streak} + 1 > ${users.bestStreak} THEN ${users.streak} + 1 ELSE ${users.bestStreak} END`,
      })
      .where(eq(users.tgId, tgId))
      .run();
    await awardXp(tgId, XP_PER_WIN);
  } else if (result === 'lose') {
    await db
      .update(users)
      .set({
        plays: sql`${users.plays} + 1`,
        losses: sql`${users.losses} + 1`,
        streak: 0,
      })
      .where(eq(users.tgId, tgId))
      .run();
    await awardXp(tgId, XP_PER_PLAY);
  } else {
    await db
      .update(users)
      .set({ plays: sql`${users.plays} + 1` })
      .where(eq(users.tgId, tgId))
      .run();
    await awardXp(tgId, XP_PER_PLAY);
  }
}

export async function gamesCount() {
  return db.$count(games);
}

export async function gameStats(game) {
  const total = await db.$count(games, eq(games.game, game));
  const wins = await db.$count(games, and(eq(games.game, game), eq(games.result, 'win')));
  return { total, wins };
}

// ---------------------------------------------------------------------------
// Sessions (short-lived interactive state, keyed by chat)
// ---------------------------------------------------------------------------

const GONE_SESSION = '#gone';

export async function getSession(chatId) {
  const row = await db.select().from(sessions).where(eq(sessions.chatId, chatId)).get();
  if (!row || row.kind === GONE_SESSION) return undefined;
  return row;
}

export async function setSession(chatId, userId, kind, data) {
  await db
    .insert(sessions)
    .values({ chatId, userId, kind, data })
    .onConflictDoUpdate({
      target: sessions.chatId,
      set: { userId, kind, data, updatedAt: sql`(unixepoch())` },
    })
    .run();
}

// DELETE with a WHERE clause does not persist on this platform, so a "cleared"
// session is a tombstone row that getSession treats as absent.
export async function clearSession(chatId) {
  await setSession(chatId, 0, GONE_SESSION, null);
}

// ---------------------------------------------------------------------------
// Stats / leaderboard
// ---------------------------------------------------------------------------

export async function leaderboard(limit = 10) {
  return db.select().from(users).orderBy(desc(users.coins)).limit(limit).all();
}

export async function userRank(tgId) {
  const user = await getUser(tgId);
  if (!user) return 0;
  const ahead = await db.$count(users, sql`${users.coins} > ${user.coins}`);
  return ahead + 1;
}

export async function botStats() {
  const total = await db.$count(users);
  const banned = await db.$count(users, eq(users.isBan, true));
  const premium = await db.$count(users, eq(users.isPremium, true));
  const totalGames = await gamesCount();
  const row = await db.get(sql`SELECT COALESCE(SUM(coins),0) AS coins FROM users`);
  return { total, banned, premium, totalGames, coins: row?.coins ?? 0 };
}

export async function allUserIds() {
  return db.select({ tgId: users.tgId }).from(users).all();
}

export async function referredCount(tgId) {
  return db.$count(users, eq(users.referredBy, tgId));
}

export async function recentUsers(limit = 20) {
  return db.select().from(users).orderBy(desc(users.lastSeen)).limit(limit).all();
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

export async function logActivity(userId, action, detail) {
  await db.insert(activity).values({ userId, action, detail: detail || null }).run();
}

export async function recentActivity(limit = 15) {
  return db.select().from(activity).orderBy(desc(activity.createdAt)).limit(limit).all();
}
