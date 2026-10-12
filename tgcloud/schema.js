import { table, integer, text, boolean, index, sql } from 'sdk/db';

/**
 * users — one row per person who has interacted with the bot.
 * Relations are plain integer columns (no foreign keys — the runtime has them off).
 */
export const users = table(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tgId: integer('tg_id').unique().notNull(),
    name: text('name'),
    username: text('username'),
    lang: text('lang').default('ar'),

    coins: integer('coins').default(0),
    gems: integer('gems').default(0),
    xp: integer('xp').default(0),
    level: integer('level').default(1),

    plays: integer('plays').default(0),
    wins: integer('wins').default(0),
    losses: integer('losses').default(0),
    streak: integer('streak').default(0),
    bestStreak: integer('best_streak').default(0),
    dailyStreak: integer('daily_streak').default(0),

    isBan: boolean('is_ban').default(false),
    isPremium: boolean('is_premium').default(false),
    referredBy: integer('referred_by'),

    lastDaily: integer('last_daily', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    lastSeen: integer('last_seen', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    tgIdx: index('idx_users_tg').on(t.tgId),
    coinsIdx: index('idx_users_coins').on(t.coins),
  }),
);

/**
 * games — a record of every finished/started game round.
 * `state` holds JSON for interactive games (e.g. a tic-tac-toe board).
 */
export const games = table(
  'games',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull(),
    game: text('game').notNull(),
    bet: integer('bet').default(0),
    result: text('result'),
    reward: integer('reward').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    userIdx: index('idx_games_user').on(t.userId),
    gameIdx: index('idx_games_game').on(t.game),
  }),
);

/**
 * sessions — short-lived interactive state, keyed by chat.
 * Used for pending games, the guess flow, broadcast input, admin actions, etc.
 */
export const sessions = table('sessions', {
  chatId: integer('chat_id').primaryKey(),
  userId: integer('user_id'),
  kind: text('kind'),
  data: text('data', { mode: 'json' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

/**
 * settings — key/value store for bot-wide flags (maintenance, disabled games, ...).
 */
export const settings = table('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }),
});

/**
 * achievements — unlocked achievement codes per user.
 */
export const achievements = table(
  'achievements',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull(),
    code: text('code').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    userIdx: index('idx_ach_user').on(t.userId),
  }),
);

/**
 * activity — an audit/event log the developer panel can read.
 */
export const activity = table(
  'activity',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id'),
    action: text('action'),
    detail: text('detail'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    createdIdx: index('idx_activity_created').on(t.createdAt),
  }),
);
