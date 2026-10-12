// Central configuration for the bot.

// Project identifiers (DEVELOPER_ID, APP_ID, WEBAPP_URL, DEV_WEBAPP_URL,
// BOT_URL) live in ./ids.js — that is the single place to look at / edit them.
export { DEVELOPER_ID, APP_ID, WEBAPP_URL, DEV_WEBAPP_URL, BOT_URL } from './ids.js';

export const BOT_NAME = 'Serverless Bot';
export const DEFAULT_LANG = 'en';

export const CURRENCY = '🪙';
export const GEM = '💎';

// Economy
export const START_COINS = 500;
export const DAILY_AMOUNT = 250;
export const DAILY_STREAK_BONUS = 50;
export const REFERRAL_BONUS = 150;
export const REFERRED_BONUS = 100;

// Game rewards (games are free to play — no bets)
export const WIN_REWARD = 50;
export const BIG_WIN_REWARD = 100;

// Mini App math challenge: a wrong answer costs this share of WIN_REWARD.
export const WRONG_LOSS_RATIO = 0.8;

// A lost round costs this share of the game's win reward (all games).
// Never drops the balance below zero.
export const LOSS_PENALTY_RATIO = 0.8;

// Leveling
export const XP_PER_LEVEL = 100;
export const XP_PER_WIN = 20;
export const XP_PER_PLAY = 5;

// Supported languages
export const LANGS = ['ar', 'en'];
