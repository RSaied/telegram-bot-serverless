import { api } from 'sdk';
import { t } from '../lib/i18n.js';
import { DEFAULT_LANG, CURRENCY } from '../lib/config.js';
import * as db from '../lib/db.js';
import { userDisplay, ltrNum } from '../lib/format.js';
import { GAMES, gameById } from '../lib/games/index.js';
import { getSetting, setSetting } from '../lib/settings.js';
import { tokenId } from '../lib/pvp.js';

// Games that can be played inline against another person (1v1).
const PVP_IDS = ['tictactoe', 'rps'];
const ALIASES = {
  tictactoe: ['ttt', 'xo', 'x o', 'اكس', 'ايكس', 'ضومنة'],
  rps: ['rock', 'paper', 'scissors', 'حجرة', 'ورقة', 'مقص'],
};

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

function gameMatches(g, lang, q) {
  if (!q) return true;
  if (g.id.includes(q)) return true;
  if (t(lang, g.nameKey).toLowerCase().includes(q)) return true;
  const alias = ALIASES[g.id] || [];
  return alias.some((a) => a.includes(q) || q.includes(a));
}

export default async function (inlineQuery) {
  const from = inlineQuery.from;
  const user = await db.ensureUser(from);
  const lang = user.lang || DEFAULT_LANG;
  const q = (inlineQuery.query || '').trim().toLowerCase();
  const username = await botName();

  const results = [];

  // Profile share card (localized).
  if (!q || 'profile'.includes(q) || 'ملف'.includes(q)) {
    const rank = await db.userRank(user.tgId);
    results.push({
      type: 'article',
      id: 'profile',
      title: '👤 ' + userDisplay(user),
      description:
        `${ltrNum(user.coins)} ${CURRENCY} • ${t(lang, 'inl_level')} ${user.level} • ` +
        `${t(lang, 'inl_rank')} #${rank} • ${t(lang, 'inl_wins')} ${user.wins}`,
      input_message_content: {
        message_text:
          `👤 *${userDisplay(user)}*\n` +
          `${t(lang, 'inl_level')}: ${user.level}\n` +
          `🪙 ${ltrNum(user.coins)} ${CURRENCY}\n` +
          `${t(lang, 'inl_plays')}: ${user.plays} • ${t(lang, 'inl_wins')}: ${user.wins}\n` +
          `${t(lang, 'inl_rank')}: #${rank}`,
        parse_mode: 'Markdown',
      },
      reply_markup: {
        inline_keyboard: [[{ text: t(lang, 'inl_play'), url: `https://t.me/${username}?start=ref_${user.tgId}` }]],
      },
    });
  }

  // PvP results (1v1 against a friend) — Join button starts the room.
  for (const gid of PVP_IDS) {
    const g = gameById(gid);
    if (!g || !gameMatches(g, lang, q)) continue;
    const title = t(lang, g.nameKey);
    const tok = tokenId();
    results.push({
      type: 'article',
      id: `pvp_${g.id}_${tok}`,
      title: `${t(lang, 'inl_pvp')} ${g.emoji} ${title}`,
      description: t(lang, 'inl_pvp_desc'),
      input_message_content: {
        message_text: `${g.emoji} *${title}* ${t(lang, 'inl_pvp')}\n${t(lang, 'inl_pvp_text')}`,
        parse_mode: 'Markdown',
      },
      reply_markup: {
        inline_keyboard: [[{ text: t(lang, 'inl_join'), callback_data: `pvp:join:${tok}:${g.id}` }]],
      },
    });
  }

  // All games playable against the bot — Start sends the game to your DM.
  for (const g of GAMES) {
    const title = t(lang, g.nameKey);
    if (!gameMatches(g, lang, q)) continue;
    results.push({
      type: 'article',
      id: 'ib_' + g.id,
      title: `${g.emoji} ${title}`,
      description: t(lang, 'ib_desc'),
      input_message_content: {
        message_text: `${g.emoji} *${title}*\n${t(lang, 'ib_desc')}`,
        parse_mode: 'Markdown',
      },
      reply_markup: {
        inline_keyboard: [[{ text: t(lang, 'ib_start'), callback_data: `ib:start:${g.id}` }]],
      },
    });
  }

  await api.answerInlineQuery({
    inline_query_id: inlineQuery.id,
    results: results.slice(0, 20),
    cache_time: 5,
    is_personal: true,
  });
}