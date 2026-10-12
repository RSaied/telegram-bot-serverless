import { api } from 'sdk';
import { t } from '../lib/i18n.js';
import { DEVELOPER_ID, DEFAULT_LANG, REFERRAL_BONUS, REFERRED_BONUS, CURRENCY } from '../lib/config.js';
import * as db from '../lib/db.js';
import { escapeMd } from '../lib/format.js';
import { isMaintenance, getSetting, setSetting } from '../lib/settings.js';
import {
  mainScreen, profileScreen, topScreen, gamesScreen, shopScreen,
  refScreen, achScreen, statsScreen, settingsScreen, helpScreen, aboutScreen,
} from '../lib/menu.js';
import { claimDaily } from '../lib/daily.js';
import { sendMessage } from '../lib/ui.js';
import { handleAdminText, adminHome } from '../lib/admin.js';
import { gameById } from '../lib/games/index.js';

function sendScreen(chatId, screen) {
  return sendMessage(chatId, screen.text, { reply_markup: screen.keyboard });
}

async function botName() {
  let name = await getSetting('botUsername');
  if (!name) {
    try {
      const me = await api.getMe();
      name = me.username || 'bot';
      await setSetting('botUsername', name);
    } catch (_) {
      name = 'bot';
    }
  }
  return name;
}

export default async function (message, ctx) {
  const from = message.from;
  if (!from || from.is_bot) return;

  const chatId = message.chat.id;
  const isNew = !(await db.getUser(from.id));
  const user = await db.ensureUser(from);
  const lang = user.lang || DEFAULT_LANG;
  const isDev = from.id === DEVELOPER_ID;
  const text = (message.text || '').trim();

  if (!isDev && (await isMaintenance())) {
    await sendMessage(chatId, t(lang, 'maintenance'));
    return;
  }
  if (user.isBan && !isDev) {
    await sendMessage(chatId, t(lang, 'you_are_banned'));
    return;
  }

  // ---- Referral / commands -------------------------------------------------
  if (text.startsWith('/')) {
    const [cmdRaw, ...rest] = text.split(/\s+/);
    const cmd = cmdRaw.toLowerCase().split('@')[0];
    const param = rest.join(' ').trim();

    await db.clearSession(chatId);

    switch (cmd) {
      case '/start': {
        let extra = '';
        if (param.startsWith('ref_') && isNew) {
          const refId = parseInt(param.slice(4), 10);
          if (Number.isFinite(refId) && refId !== from.id) {
            await db.setReferredBy(from.id, refId);
            await db.addCoins(from.id, REFERRED_BONUS);
            await db.addCoins(refId, REFERRAL_BONUS);
            const referrer = await db.getUser(refId);
            extra = t(lang, 'ref_welcome', {
              name: escapeMd(referrer ? referrer.name || referrer.tgId : refId),
              bonus: REFERRED_BONUS,
              currency: CURRENCY,
            });
          }
        }
        await db.logActivity(user.id, 'start', isNew ? 'new user' : 'returning');
        await sendMessage(
          chatId,
          t(lang, 'start_text', { name: escapeMd(from.first_name || 'friend') }) + extra +
            '\n\n' + t(lang, 'our_links', { channel: 'https://t.me/Botate', site: 'https://ssss.sy' }) +
            '\n\n' + t(lang, 'open_source', { repo: 'https://github.com/RSaied/telegram-bot-serverless' }),
          { reply_markup: (await mainScreen(user, lang, message.chat.type)).keyboard },
        );
        return;
      }
      case '/help':
        return sendScreen(chatId, helpScreen(lang));
      case '/about':
        return sendScreen(chatId, aboutScreen(lang));
      case '/games':
        return sendScreen(chatId, await gamesScreen(lang));
      case '/profile':
        return sendScreen(chatId, profileScreen(user, lang));
      case '/top':
        return sendScreen(chatId, await topScreen(lang));
      case '/stats':
        return sendScreen(chatId, await statsScreen(user, lang));
      case '/shop':
        return sendScreen(chatId, await shopScreen(user, lang));
      case '/ach':
        return sendScreen(chatId, await achScreen(user, lang));
      case '/settings':
      case '/lang':
        return sendScreen(chatId, settingsScreen(lang));
      case '/ref': {
        const withName = { ...user, botUsername: await botName() };
        return sendScreen(chatId, await refScreen(withName, lang));
      }
      case '/daily': {
        const res = await claimDaily(user, lang);
        await db.logActivity(user.id, 'daily', res.ok ? 'claimed' : 'early');
        return sendMessage(chatId, res.text, {
          reply_markup: { inline_keyboard: [[{ text: t(lang, 'back'), callback_data: 'menu:main' }]] },
        });
      }
      case '/dev':
      case '/admin': {
        if (!isDev) return sendMessage(chatId, t(lang, 'dev_only'));
        return sendScreen(chatId, adminHome(lang));
      }
      case '/cancel':
        await db.clearSession(chatId);
        return sendMessage(chatId, t(lang, 'cancel'));
      default:
        return sendMessage(chatId, t(lang, 'unknown'));
    }
  }

  // ---- Active interactive session -----------------------------------------
  const session = await db.getSession(chatId);
  if (session && session.userId === from.id && session.kind) {
    if (session.kind.startsWith('game:')) {
      const game = gameById(session.kind.slice(5));
      if (game && typeof game.onText === 'function') {
        await game.onText({ user, lang, chatId, data: session.data, text, message });
        return;
      }
    }
    if (session.kind.startsWith('admin:') && isDev) {
      const result = await handleAdminText(session.kind, message, session.data, lang);
      await db.clearSession(chatId);
      if (result) {
        await sendMessage(chatId, result.text, { reply_markup: result.keyboard });
        return;
      }
    }
  }

  // ---- Fallback ------------------------------------------------------------
  await sendMessage(chatId, t(lang, 'unknown'), {
    reply_markup: (await mainScreen(user, lang, message.chat.type)).keyboard,
  });
}
