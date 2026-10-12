import { t } from './i18n.js';
import { DEV_WEBAPP_URL, CURRENCY, GEM } from './config.js';
import { ltrNum } from './format.js';

function btn(text, data) {
  return { text, callback_data: data };
}

export function mainMenu(lang, isDev = false, extra = [], webAppUrl = null) {
  const rows = [
    [btn(t(lang, 'btn_games'), 'menu:games'), btn(t(lang, 'btn_profile'), 'menu:profile')],
    [btn(t(lang, 'btn_top'), 'menu:top'), btn(t(lang, 'btn_daily'), 'menu:daily')],
    [btn(t(lang, 'btn_shop'), 'menu:shop'), btn(t(lang, 'btn_stats'), 'menu:stats')],
    [btn(t(lang, 'btn_ref'), 'menu:ref'), btn(t(lang, 'btn_ach'), 'menu:ach')],
    [btn(t(lang, 'btn_settings'), 'menu:settings'), btn(t(lang, 'btn_help'), 'menu:help')],
    [btn(t(lang, 'btn_about'), 'menu:about')],
    [{ text: t(lang, 'btn_channel'), url: 'https://t.me/Botate' }],
  ];
  if (webAppUrl) rows.push([{ text: t(lang, 'btn_app'), web_app: { url: webAppUrl } }]);
  if (isDev) rows.push([btn(t(lang, 'btn_dev'), 'menu:dev')]);
  for (const r of extra) rows.push(r);
  return rows;
}

export function mainMenuKeyboard(lang, isDev = false, extra = [], webAppUrl = null) {
  return { inline_keyboard: mainMenu(lang, isDev, extra, webAppUrl) };
}

export function backKeyboard(lang, target = 'menu:main', extra = []) {
  const rows = [...extra, [btn(t(lang, 'back'), target)]];
  return { inline_keyboard: rows };
}

export function gamesKeyboard(lang, gameDefs, disabled = [], inlineText = null) {
  const rows = [];
  let pair = [];
  for (const g of gameDefs) {
    const off = disabled.includes(g.id);
    pair.push(btn(`${g.emoji} ${t(lang, g.nameKey)}${off ? ' 🚫' : ''}`, `game:start:${g.id}`));
    if (pair.length === 2) {
      rows.push(pair);
      pair = [];
    }
  }
  if (pair.length) rows.push(pair);
  if (inlineText) rows.push([{ text: inlineText, switch_inline_query: '' }]);
  rows.push([btn(t(lang, 'back'), 'menu:main')]);
  return { inline_keyboard: rows };
}

export function playAgainKeyboard(lang, gameId) {
  return {
    inline_keyboard: [
      [btn(t(lang, 'play_again'), `game:again:${gameId}`)],
      [btn(t(lang, 'back'), 'menu:games')],
    ],
  };
}

export function settingsKeyboard(lang) {
  const ar = lang === 'ar' ? '✅ ' : '';
  const en = lang === 'en' ? '✅ ' : '';
  return {
    inline_keyboard: [
      [btn(`${ar}🇸🇦 العربية`, 'lang:ar'), btn(`${en}🇬🇧 English`, 'lang:en')],
      [btn(t(lang, 'back'), 'menu:main')],
    ],
  };
}

export function shopKeyboard(lang, items) {
  const rows = items.map((it) => {
    const cur = it.pay === 'gems' ? GEM : CURRENCY;
    return [btn(`${it.emoji} ${lang === 'ar' ? it.ar : it.en} — ${ltrNum(it.price)} ${cur}`, `shop:buy:${it.id}`)];
  });
  rows.push([btn(t(lang, 'back'), 'menu:main')]);
  return { inline_keyboard: rows };
}

export function confirmKeyboard(lang, yesData, noData) {
  return {
    inline_keyboard: [[btn(t(lang, 'yes'), yesData), btn(t(lang, 'no'), noData)]],
  };
}

// Developer panel
export function devKeyboard(lang, disabledGames = []) {
  const rows = [
    [btn(t(lang, 'admin_stats'), 'dev:stats'), btn(t(lang, 'admin_users'), 'dev:users')],
    [btn(t(lang, 'admin_broadcast'), 'dev:broadcast'), btn(t(lang, 'admin_search'), 'dev:search')],
    [btn(t(lang, 'admin_give'), 'dev:give'), btn(t(lang, 'admin_dm'), 'dev:dm')],
    [btn(t(lang, 'admin_games'), 'dev:games'), btn(t(lang, 'admin_maintenance'), 'dev:maintenance')],
    [btn(t(lang, 'admin_log'), 'dev:log')],
    [{ text: t(lang, 'admin_storage'), web_app: { url: DEV_WEBAPP_URL } }],
    [btn(t(lang, 'back'), 'menu:main')],
  ];
  return { inline_keyboard: rows };
}

export function devGamesKeyboard(lang, gameDefs, disabled = []) {
  const rows = gameDefs.map((g) => {
    const on = !disabled.includes(g.id);
    return [btn(`${on ? '🟢' : '🔴'} ${g.emoji} ${t(lang, g.nameKey)}`, `dev:game:${g.id}`) ];
  });
  rows.push([btn(t(lang, 'back'), 'menu:dev')]);
  return { inline_keyboard: rows };
}
