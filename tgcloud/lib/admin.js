import { api } from 'sdk';
import { t } from './i18n.js';
import { ltrNum, formatDuration, userDisplay, truncate } from './format.js';
import { CURRENCY } from './config.js';
import * as db from './db.js';
import { isMaintenance, setSetting, disabledGames, setGameEnabled } from './settings.js';
import { gameDefs } from './games/index.js';
import { devKeyboard, devGamesKeyboard, backKeyboard } from './keyboards.js';
import { sendMessage } from './ui.js';

export function adminHome(lang) {
  return { text: t(lang, 'admin_title'), keyboard: devKeyboard(lang) };
}

export async function adminStats(lang) {
  const s = await db.botStats();
  const maint = await isMaintenance();
  const text =
    t(lang, 'admin_title') +
    '\n\n' +
    t(lang, 'dev_stats_body', {
      total: ltrNum(s.total),
      banned: ltrNum(s.banned),
      premium: ltrNum(s.premium),
      games: ltrNum(s.totalGames),
      coins: ltrNum(s.coins),
      maint: maint ? '🛠️ ON' : '✅ OFF',
    });
  return { text, keyboard: devKeyboard(lang) };
}

export async function adminUsers(lang) {
  const rows = await db.recentUsers(10);
  const lines = rows.map(
    (u) => `${u.isBan ? '🚫' : '✅'} ${userDisplay(u)} — ${ltrNum(u.coins)} ${CURRENCY} (id ${u.tgId})`,
  );
  const buttons = rows.slice(0, 8).map((u) => [
    { text: `${u.isBan ? '✅ فك حظر' : '🚫 حظر'} ${truncate(u.name || u.tgId, 12)}`, callback_data: `dev:ban:${u.tgId}` },
  ]);
  buttons.push([{ text: t(lang, 'back'), callback_data: 'menu:dev' }]);
  return {
    text: t(lang, 'admin_users') + '\n\n' + (lines.join('\n') || '—'),
    keyboard: { inline_keyboard: buttons },
  };
}

export async function adminGames(lang) {
  const disabled = await disabledGames();
  return {
    text: t(lang, 'admin_games') + '\n\n' + t(lang, 'dev_games_hint'),
    keyboard: devGamesKeyboard(lang, gameDefs(), disabled),
  };
}

export async function adminLog(lang) {
  const rows = await db.recentActivity(15);
  const lines = rows.map((a) => `• [${a.action}] ${truncate(a.detail || '', 60)}`);
  return {
    text: t(lang, 'admin_log') + '\n\n' + (lines.join('\n') || '—'),
    keyboard: backKeyboard(lang, 'menu:dev'),
  };
}

// ---- Actions ---------------------------------------------------------------

export async function toggleGame(gameId, lang) {
  const disabled = await disabledGames();
  const nowEnabled = disabled.includes(gameId);
  await setGameEnabled(gameId, nowEnabled);
  await db.logActivity(null, 'toggle_game', `${gameId} -> ${nowEnabled ? 'on' : 'off'}`);
  return adminGames(lang);
}

export async function toggleMaintenance(lang) {
  const cur = await isMaintenance();
  await setSetting('maintenance', !cur);
  await db.logActivity(null, 'maintenance', !cur ? 'on' : 'off');
  return adminStats(lang);
}

export async function toggleBan(tgId, lang) {
  const user = await db.getUser(tgId);
  if (user) {
    const nowBanned = !user.isBan;
    await db.setBan(tgId, nowBanned);
    await db.logActivity(null, 'ban', `${tgId} -> ${nowBanned ? 'banned' : 'unbanned'}`);
    const uLang = user.lang || 'ar';
    try {
      await sendMessage(tgId, t(uLang, nowBanned ? 'notif_banned' : 'notif_unbanned'));
    } catch (_) {
      // user blocked the bot — skip
    }
  }
  return adminUsers(lang);
}

/**
 * Handle the developer's reply for the active admin session.
 * `message` is the raw Telegram Message (so media broadcasts work); `data` is
 * the session payload (e.g. { forward: true } for a forwarding broadcast).
 * Returns { text, keyboard } for the resulting screen, or null if not an admin flow.
 */
export async function handleAdminText(kind, message, data, lang) {
  const text = ((message && (message.text || message.caption)) || '').trim();

  if (kind === 'admin:broadcast') {
    const forward = !!(data && data.forward);
    const fromChatId = message.chat.id;
    const messageId = message.message_id;
    const ids = await db.allUserIds();
    let sent = 0;
    for (const row of ids) {
      try {
        if (forward) {
          await api.forwardMessage({ chat_id: row.tgId, from_chat_id: fromChatId, message_id: messageId });
        } else {
          await api.copyMessage({ chat_id: row.tgId, from_chat_id: fromChatId, message_id: messageId });
        }
        sent++;
      } catch (_) {
        // user blocked the bot — skip
      }
    }
    await db.logActivity(null, 'broadcast', `${forward ? 'forward' : 'copy'} sent ${sent}/${ids.length}`);
    return {
      text: t(lang, 'broadcast_done', { sent, total: ids.length }),
      keyboard: backKeyboard(lang, 'menu:dev'),
    };
  }

  if (kind === 'admin:give') {
    const parts = text.trim().split(/\s+/);
    const tgId = parseInt(parts[0], 10);
    const amount = parseInt(parts[1], 10);
    if (!Number.isFinite(tgId) || !Number.isFinite(amount)) {
      return { text: t(lang, 'dev_give_usage'), keyboard: backKeyboard(lang, 'menu:dev') };
    }
    await db.addCoins(tgId, amount);
    await db.logActivity(null, 'give_coins', `${tgId} +${amount}`);
    const target = await db.getUser(tgId);
    if (target) {
      const uLang = target.lang || 'ar';
      try {
        await sendMessage(tgId, t(uLang, 'notif_coins', { amount, currency: CURRENCY }));
      } catch (_) {
        // user blocked the bot — skip
      }
    }
    return {
      text: t(lang, 'dev_gave', { tgId, amount, currency: CURRENCY }),
      keyboard: backKeyboard(lang, 'menu:dev'),
    };
  }

  if (kind === 'admin:dm') {
    const idx = text.indexOf(' ');
    const tgId = parseInt(text.slice(0, idx), 10);
    const message = text.slice(idx + 1);
    if (!Number.isFinite(tgId) || !message) {
      return { text: t(lang, 'dev_dm_usage'), keyboard: backKeyboard(lang, 'menu:dev') };
    }
    try {
      await sendMessage(tgId, message);
      await db.logActivity(null, 'dm', `${tgId}: ${truncate(message, 40)}`);
      return { text: t(lang, 'send_ok'), keyboard: backKeyboard(lang, 'menu:dev') };
    } catch (e) {
      return { text: `❗ ${e.description || e.message}`, keyboard: backKeyboard(lang, 'menu:dev') };
    }
  }

  if (kind === 'admin:search') {
    const tgId = parseInt(String(text).trim(), 10);
    const u = Number.isFinite(tgId) ? await db.getUser(tgId) : null;
    const line = u
      ? `• ${userDisplay(u)} — id ${u.tgId} — ${ltrNum(u.coins)} ${CURRENCY}`
      : '—';
    return {
      text: t(lang, 'admin_search') + '\n\n' + line,
      keyboard: backKeyboard(lang, 'menu:dev'),
    };
  }

  return null;
}
