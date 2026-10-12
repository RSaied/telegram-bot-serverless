import { t } from './i18n.js';
import { DAILY_AMOUNT, DAILY_STREAK_BONUS, CURRENCY } from './config.js';
import { addCoins, setDaily, setDailyStreak } from './db.js';
import { formatDuration } from './format.js';

const DAY = 24 * 60 * 60 * 1000;

export async function claimDaily(user, lang) {
  const now = Date.now();
  const last = user.lastDaily ? new Date(user.lastDaily).getTime() : 0;
  const diff = now - last;

  if (last && diff < DAY) {
    return { ok: false, text: t(lang, 'daily_wait', { time: formatDuration(DAY - diff) }) };
  }

  const streak = last && diff < 2 * DAY ? (user.dailyStreak || 0) + 1 : 1;
  const amount = DAILY_AMOUNT + (streak - 1) * DAILY_STREAK_BONUS;

  await addCoins(user.tgId, amount);
  await setDaily(user.tgId, new Date(now));
  await setDailyStreak(user.tgId, streak);

  return { ok: true, text: t(lang, 'daily_ready', { amount, currency: CURRENCY, streak }) };
}
