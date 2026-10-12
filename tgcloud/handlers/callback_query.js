import { api } from 'sdk';
import { t } from '../lib/i18n.js';
import { DEVELOPER_ID, DEFAULT_LANG, CURRENCY } from '../lib/config.js';
import * as db from '../lib/db.js';
import { isMaintenance, getSetting, setSetting, isGameEnabled } from '../lib/settings.js';
import {
  mainScreen, profileScreen, topScreen, gamesScreen, shopScreen,
  refScreen, achScreen, statsScreen, settingsScreen, helpScreen, aboutScreen, SHOP_ITEMS,
} from '../lib/menu.js';
import { claimDaily } from '../lib/daily.js';
import { editMessage, answerCallback, sendMessage } from '../lib/ui.js';
import { gameById } from '../lib/games/index.js';
import { startGame } from '../lib/gameflow.js';
import { handle as pvpHandle } from '../lib/pvp.js';
import { ibToken, start as inlineStart, move as inlineMove } from '../lib/inlinebot.js';
import { adminHome, adminStats, adminUsers, adminGames, adminLog, toggleGame, toggleMaintenance, toggleBan } from '../lib/admin.js';

const GAME_CB = { rps: 'rps', quiz: 'quiz', ttt: 'tictactoe', flip: 'flip', highlow: 'highlow' };

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

export default async function (query) {
  const from = query.from;
  const chatId = query.message ? query.message.chat.id : null;
  const messageId = query.message ? query.message.message_id : null;
  const data = query.data || '';

  const user = await db.ensureUser(from);
  const lang = user.lang || DEFAULT_LANG;
  const isDev = from.id === DEVELOPER_ID;

  const done = () => answerCallback(query.id);

  const show = async (screen) => {
    if (messageId) {
      await editMessage(chatId, messageId, screen.text, { reply_markup: screen.keyboard });
    } else {
      await sendMessage(from.id, screen.text, { reply_markup: screen.keyboard });
    }
    await done();
  };

  // maintenance gate (dev can always use the panel)
  if (!isDev && (await isMaintenance())) {
    await answerCallback(query.id, t(lang, 'maintenance'), { show_alert: true });
    return;
  }
  if (user.isBan && !isDev) {
    await answerCallback(query.id, t(lang, 'you_are_banned'), { show_alert: true });
    return;
  }

  const [ns, ...rest] = data.split(':');

  try {
    // ---- inline 1v1 games (pvp) ----
    if (ns === 'pvp') {
      const action = rest[0];
      const token = parseInt(rest[1], 10);
      const value = rest.slice(2).join(':');
      if (!Number.isFinite(token)) return done();
      await pvpHandle({
        action,
        token,
        value,
        user: { id: from.id, name: user.name || user.username || from.id, lang },
        callbackQueryId: query.id,
        inlineMessageId: query.inline_message_id || null,
      });
      return;
    }

    // ---- inline vs-bot games (ib: start) ----
    if (ns === 'ib') {
      if (rest[0] !== 'start') return done();
      const gameId = rest[1];
      const game = gameById(gameId);
      if (!game) return done();
      if (!(await isGameEnabled(gameId))) {
        await answerCallback(query.id, t(lang, 'game_disabled'), { show_alert: true });
        return;
      }
      const token = ibToken();
      await inlineStart({
        gameId,
        token,
        user,
        lang,
        inlineMessageId: query.inline_message_id || null,
        callbackQueryId: query.id,
      });
      return;
    }

    // ---- inline vs-bot game moves (ibp) ----
    if (ns === 'ibp') {
      const action = rest[0];
      const token = parseInt(rest[1], 10);
      if (!Number.isFinite(token)) return done();
      const gameId = action;
      const value = rest.slice(2).join(':');
      await inlineMove({
        action,
        gameId,
        token,
        value,
        user,
        lang,
        inlineMessageId: query.inline_message_id || null,
        callbackQueryId: query.id,
      });
      return;
    }

    // ---- game move callbacks (rps / quiz / tic-tac-toe / flip / highlow) ----
    if (GAME_CB[ns]) {
      const gameId = GAME_CB[ns];
      const session = await db.getSession(chatId);
      const game = gameById(gameId);
      if (session && session.kind === `game:${gameId}` && game && game.onCallback) {
        await game.onCallback({
          user, lang, chatId, messageId,
          data: session.data,
          value: rest.join(':'),
          callbackQueryId: query.id,
        });
      } else {
        await answerCallback(query.id, '⌛', { show_alert: false });
      }
      return;
    }

    switch (ns) {
      case 'menu': {
        if (chatId) await db.clearSession(chatId);
        const page = rest[0];
        if (page === 'main') return show(await mainScreen(user, lang, query.message && query.message.chat ? query.message.chat.type : null));
        if (page === 'games') return show(await gamesScreen(lang));
        if (page === 'profile') return show(profileScreen(user, lang));
        if (page === 'top') return show(await topScreen(lang));
        if (page === 'stats') return show(await statsScreen(user, lang));
        if (page === 'shop') return show(await shopScreen(user, lang));
        if (page === 'ach') return show(await achScreen(user, lang));
        if (page === 'settings') return show(settingsScreen(lang));
        if (page === 'help') return show(helpScreen(lang));
        if (page === 'about') return show(aboutScreen(lang));
        if (page === 'ref') {
          const withName = { ...user, botUsername: await botName() };
          return show(await refScreen(withName, lang));
        }
        if (page === 'daily') {
          const res = await claimDaily(user, lang);
          return show({
            text: res.text,
            keyboard: { inline_keyboard: [[{ text: t(lang, 'back'), callback_data: 'menu:main' }]] },
          });
        }
        if (page === 'dev') {
          if (!isDev) return answerCallback(query.id, t(lang, 'dev_only'), { show_alert: true });
          return show(adminHome(lang));
        }
        return done();
      }

      case 'lang': {
        const newLang = rest[0];
        await db.setLang(user.tgId, newLang);
        await answerCallback(query.id, t(newLang, 'lang_changed'));
        return show(settingsScreen(newLang));
      }

      case 'game': {
        const action = rest[0];
        if (action === 'start' || action === 'again') {
          const gameId = rest[1];
          await done();
          await startGame({ user, lang, chatId, gameId, messageId });
          return;
        }
        return done();
      }

      case 'shop': {
        if (rest[0] !== 'buy') return done();
        const item = SHOP_ITEMS.find((i) => i.id === rest[1]);
        if (!item) return done();
        const bal = item.currency === '💎' ? user.gems : user.coins;
        if (bal < item.price) {
          await answerCallback(query.id, t(lang, 'not_enough_coins'), { show_alert: true });
          return;
        }
        if (item.currency === '💎') await db.addGems(user.tgId, -item.price);
        else await db.addCoins(user.tgId, -item.price);
        const ap = item.apply;
        if (ap.xp) await db.awardXp(user.tgId, ap.xp);
        if (ap.coins) await db.addCoins(user.tgId, ap.coins);
        if (ap.gems) await db.addGems(user.tgId, ap.gems);
        if (ap.premium) await db.setPremium(user.tgId, true);
        await db.logActivity(user.id, 'shop', item.id);
        await answerCallback(query.id, t(lang, 'shop_bought'));
        const fresh = await db.getUser(user.tgId);
        return show(await shopScreen(fresh, lang));
      }

      case 'dev': {
        if (!isDev) return answerCallback(query.id, t(lang, 'dev_only'), { show_alert: true });
        if (chatId) await db.clearSession(chatId);
        const action = rest[0];
        if (action === 'stats') return show(await adminStats(lang));
        if (action === 'users') return show(await adminUsers(lang));
        if (action === 'games') return show(await adminGames(lang));
        if (action === 'log') return show(await adminLog(lang));
        if (action === 'maintenance') return show(await toggleMaintenance(lang));
        if (action === 'game') return show(await toggleGame(rest[1], lang));
        if (action === 'ban') return show(await toggleBan(parseInt(rest[1], 10), lang));
        if (action === 'broadcast') {
          return show({
            text: t(lang, 'admin_broadcast') + '\n\n' + t(lang, 'broadcast_choose_mode'),
            keyboard: {
              inline_keyboard: [
                [
                  { text: t(lang, 'broadcast_mode_copy'), callback_data: 'dev:bcast:copy' },
                  { text: t(lang, 'broadcast_mode_forward'), callback_data: 'dev:bcast:forward' },
                ],
                [{ text: t(lang, 'cancel'), callback_data: 'menu:dev' }],
              ],
            },
          });
        }
        if (action === 'bcast') {
          const forward = rest[1] === 'forward';
          await db.setSession(chatId, user.tgId, 'admin:broadcast', { forward });
          return show({
            text: t(lang, 'admin_broadcast') + '\n\n' + t(lang, 'broadcast_prompt'),
            keyboard: { inline_keyboard: [[{ text: t(lang, 'cancel'), callback_data: 'menu:dev' }]] },
          });
        }
        if (action === 'search' || action === 'give' || action === 'dm') {
          const kind = `admin:${action}`;
          await db.setSession(chatId, user.tgId, kind, {});
          const prompts = {
            search: t(lang, 'dev_search_prompt'),
            give: t(lang, 'dev_give_usage'),
            dm: t(lang, 'dev_dm_usage'),
          };
          return show({
            text: prompts[action],
            keyboard: { inline_keyboard: [[{ text: t(lang, 'cancel'), callback_data: 'menu:dev' }]] },
          });
        }
        return show(adminHome(lang));
      }

      default:
        return done();
    }
  } catch (e) {
    await answerCallback(query.id, `❗ ${e.description || e.message}`, { show_alert: true }).catch(() => {});
  }
}
