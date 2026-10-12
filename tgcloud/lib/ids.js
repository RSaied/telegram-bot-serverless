// ─────────────────────────────────────────────────────────────────────────────
//  PROJECT IDENTIFIERS — EDIT THESE IN ONE PLACE
// -----------------------------------------------------------------------------
// Every project-specific identifier (the ones you may want to look up or change)
// lives here, so there is a single file to check. Import them by name:
//
//   import { DEVELOPER_ID, APP_ID, WEBAPP_URL, DEV_WEBAPP_URL } from '../lib/ids.js';
//
// or inspect them all at once:
//
//   import { IDS } from '../lib/ids.js'; // -> { DEVELOPER_ID, APP_ID, ... }
// ─────────────────────────────────────────────────────────────────────────────

// Numeric Telegram user id of the developer / super-admin (owner of the panel).
export const DEVELOPER_ID = 112621302;

// Telegram Serverless app id — the "app<id>" prefix of the CLI token.
export const APP_ID = 'app8985509362';

// Deployed Mini App (static front-end) base URL, derived from APP_ID.
export const WEBAPP_URL = `https://${APP_ID}.tgcloud.ai/`;

// The same Mini App, opened straight into the developer storage console.
export const DEV_WEBAPP_URL = `${WEBAPP_URL}?admin=1`;

// Public bot link — for testing / sharing.
export const BOT_URL = 'https://t.me/Serverless_BetaBot';

// Convenience bundle: inspect/import every identifier at once.
export const IDS = { DEVELOPER_ID, APP_ID, WEBAPP_URL, DEV_WEBAPP_URL, BOT_URL };
