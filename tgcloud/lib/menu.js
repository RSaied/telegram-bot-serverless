import { t } from './i18n.js';
import { CURRENCY, GEM, XP_PER_LEVEL, REFERRAL_BONUS, DEVELOPER_ID, WEBAPP_URL } from './config.js';
import { levelFromXp, ltrNum, userDisplay } from './format.js';
import * as db from './db.js';
import { listUnlocked, ACHIEVEMENTS } from './achievements.js';
import { disabledGames } from './settings.js';
import { gameDefs } from './games/index.js';
import {
  mainMenuKeyboard,
  backKeyboard,
  gamesKeyboard,
  settingsKeyboard,
  shopKeyboard,
} from './keyboards.js';

export const SHOP_ITEMS = [
  { id: 'xp100', emoji: '✨', pay: 'coins', price: 150, ar: '100 خبرة', en: '100 XP', arDesc: '+100 XP', enDesc: '+100 XP', apply: { xp: 100 } },
  { id: 'xp500', emoji: '🌟', pay: 'coins', price: 600, ar: '500 خبرة', en: '500 XP', arDesc: '+500 XP', enDesc: '+500 XP', apply: { xp: 500 } },
  { id: 'gems5', emoji: '💎', pay: 'coins', price: 1000, ar: '5 جواهر', en: '5 Gems', arDesc: '+5 💎', enDesc: '+5 💎', apply: { gems: 5 } },
  { id: 'gems25', emoji: '💠', pay: 'coins', price: 4500, ar: '25 جوهرة', en: '25 Gems', arDesc: '+25 💎', enDesc: '+25 💎', apply: { gems: 25 } },
  { id: 'coins2500', emoji: '🪙', pay: 'gems', price: 100, ar: '2,500 عملة', en: '2,500 Coins', arDesc: '+2,500 🪙', enDesc: '+2,500 🪙', apply: { coins: 2500 } },
  { id: 'coins10000', emoji: '💰', pay: 'gems', price: 350, ar: '10,000 عملة', en: '10,000 Coins', arDesc: '+10,000 🪙', enDesc: '+10,000 🪙', apply: { coins: 10000 } },
  { id: 'premium', emoji: '👑', pay: 'coins', price: 3000, ar: 'بريميوم', en: 'Premium', arDesc: 'شارة بريميوم دائمة', enDesc: 'Permanent premium badge', apply: { premium: true } },
];

export async function mainScreen(user, lang, chatType) {
  const isDev = user.tgId === DEVELOPER_ID;
  const webAppUrl = chatType === 'private' ? WEBAPP_URL : null;
  return { text: t(lang, 'menu_title'), keyboard: mainMenuKeyboard(lang, isDev, [], webAppUrl) };
}

function profileBody(user) {
  const { into, need } = levelFromXp(user.xp || 0, XP_PER_LEVEL);
  return {
    id: user.tgId,
    name: userDisplay(user),
    level: user.level,
    xp: into,
    xpNext: need,
    coins: ltrNum(user.coins),
    gems: ltrNum(user.gems),
    plays: user.plays,
    wins: user.wins,
    losses: user.losses,
    streak: user.streak,
    bestStreak: user.bestStreak,
    premium: user.isPremium ? '💎' : '—',
  };
}

export function profileScreen(user, lang) {
  return {
    text: t(lang, 'profile_title') + '\n\n' + t(lang, 'profile_body', profileBody(user)),
    keyboard: backKeyboard(lang),
  };
}

export async function topScreen(lang) {
  const rows = await db.leaderboard(10);
  let body;
  if (!rows.length) {
    body = t(lang, 'top_empty');
  } else {
    body = rows
      .map((u, i) =>
        t(lang, 'top_line', {
          rank: i + 1,
          name: userDisplay(u),
          coins: ltrNum(u.coins),
          currency: CURRENCY,
          level: u.level,
        }),
      )
      .join('\n');
  }
  return { text: t(lang, 'top_title') + '\n\n' + body, keyboard: backKeyboard(lang) };
}

export async function gamesScreen(lang) {
  const disabled = await disabledGames();
  return {
    text: t(lang, 'games_title'),
    keyboard: gamesKeyboard(lang, gameDefs(), disabled, t(lang, 'ib_try_inline')),
  };
}

export async function shopScreen(user, lang) {
  const lines = SHOP_ITEMS.map((it) => {
    const name = lang === 'ar' ? it.ar : it.en;
    const desc = lang === 'ar' ? it.arDesc : it.enDesc;
    const cur = it.pay === 'gems' ? GEM : CURRENCY;
    return `${it.emoji} ${name} — ${desc} — ${ltrNum(it.price)} ${cur}`;
  }).join('\n');
  return {
    text:
      t(lang, 'shop_title', { coins: ltrNum(user.coins), gems: ltrNum(user.gems), currency: CURRENCY }) +
      '\n' +
      t(lang, 'shop_hint') +
      '\n\n' +
      lines,
    keyboard: shopKeyboard(lang, SHOP_ITEMS),
  };
}

export async function refScreen(user, lang) {
  const count = await db.referredCount(user.tgId);
  const link = `https://t.me/${user.botUsername || 'YourBot'}?start=ref_${user.tgId}`;
  return {
    text: t(lang, 'ref_title') + '\n\n' + t(lang, 'ref_body', {
      link,
      count,
      bonus: REFERRAL_BONUS,
      currency: CURRENCY,
    }),
    keyboard: backKeyboard(lang),
  };
}

export async function achScreen(user, lang) {
  const unlocked = await listUnlocked(user.id);
  const lines = ACHIEVEMENTS.map((a) => {
    const on = unlocked.includes(a.code);
    return `${on ? a.emoji : '🔒'} ${on ? '✅' : '⬜'} ${lang === 'ar' ? a.ar : a.en}`;
  });
  return { text: t(lang, 'ach_title') + '\n\n' + lines.join('\n'), keyboard: backKeyboard(lang) };
}

export async function statsScreen(user, lang) {
  const rank = await db.userRank(user.tgId);
  const text =
    t(lang, 'stats_title') +
    '\n\n' +
    t(lang, 'profile_body', profileBody(user)) +
    '\n' +
    t(lang, 'stats_rank', { rank });
  return { text, keyboard: backKeyboard(lang) };
}

export function settingsScreen(lang) {
  return { text: t(lang, 'settings_title'), keyboard: settingsKeyboard(lang) };
}

export function helpScreen(lang) {
  return {
    text:
      t(lang, 'help_title') + '\n\n' + t(lang, 'help_body') + '\n\n' +
      t(lang, 'our_links', { channel: 'https://t.me/Botate', site: 'https://ssss.sy' }),
    keyboard: backKeyboard(lang, 'menu:main', [
      [{ text: t(lang, 'btn_channel'), url: 'https://t.me/Botate' }],
      [{ text: t(lang, 'btn_website'), url: 'https://ssss.sy' }],
    ]),
  };
}

export function aboutScreen(lang) {
  return {
    text:
      t(lang, 'about_title') + '\n\n' + t(lang, 'about_body') + '\n\n' +
      t(lang, 'our_links', { channel: 'https://t.me/Botate', site: 'https://ssss.sy' }) + '\n\n' +
      t(lang, 'open_source', { repo: 'https://github.com/RSaied/telegram-bot-serverless' }) + '\n\n' +
      t(lang, 'rate_repo'),
    keyboard: backKeyboard(lang, 'menu:main', [
      [{ text: t(lang, 'btn_channel'), url: 'https://t.me/Botate' }],
      [{ text: t(lang, 'btn_website'), url: 'https://ssss.sy' }],
      [{ text: t(lang, 'btn_rate'), url: 'https://github.com/RSaied/telegram-bot-serverless' }],
      [{ text: t(lang, 'btn_github'), url: 'https://github.com/RSaied/telegram-bot-serverless' }],
    ]),
  };
}
