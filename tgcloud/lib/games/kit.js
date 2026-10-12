import { t } from '../i18n.js';
import { render, answerCallback } from '../ui.js';
import { playAgainKeyboard } from '../keyboards.js';
import { addCoins, deductCoins, recordGame, setSession, clearSession } from '../db.js';
import { checkAfterGame } from '../achievements.js';
import { LOSS_PENALTY_RATIO, CURRENCY, WIN_REWARD } from '../config.js';
import { gameById } from './index.js';

export { answerCallback };

/**
 * Finish a round: pay the reward, persist it, update counters, unlock
 * achievements, then send (or edit) the result message with a "play again" button.
 */
export async function settle({ user, lang, gameId, result, reward = 0, text, chatId, messageId }) {
  if (result === 'win' && reward > 0) await addCoins(user.tgId, reward);

  let penalty = 0;
  if (result === 'lose') {
    const base = gameById(gameId)?.reward || WIN_REWARD;
    penalty = await deductCoins(user.tgId, Math.round(base * LOSS_PENALTY_RATIO));
  }

  await recordGame(user.tgId, gameId, result, reward);
  const unlocked = await checkAfterGame(user, { reward, won: result === 'win' });

  let out = text;
  if (penalty > 0) out += '\n' + t(lang, 'loss_penalty', { amount: penalty, currency: CURRENCY });
  if (unlocked.length) {
    const names = unlocked.map((a) => `${a.emoji} ${lang === 'ar' ? a.ar : a.en}`).join(', ');
    out += `\n\n🏅 ${names}`;
  }
  const opts = { reply_markup: playAgainKeyboard(lang, gameId) };
  await render(chatId, messageId, out, opts);
  return out;
}

/** Save interactive state for the current chat. */
export function saveState(chatId, userId, kind, data) {
  return setSession(chatId, userId, kind, data);
}

export function clearState(chatId) {
  return clearSession(chatId);
}

export { t };
