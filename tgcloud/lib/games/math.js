import { t } from '../i18n.js';
import { randomInt } from '../format.js';
import { CURRENCY, WIN_REWARD } from '../config.js';
import { settle, saveState, clearState } from './kit.js';
import { render, sendMessage } from '../ui.js';

const OPS = ['+', '-', '×'];

export default {
  id: 'math',
  emoji: '➗',
  nameKey: 'g_math',
  reward: WIN_REWARD,
  async start({ user, lang, chatId, messageId }) {
    const op = OPS[randomInt(0, OPS.length - 1)];
    const a = randomInt(2, 30);
    const b = randomInt(2, 20);
    let answer;
    if (op === '+') answer = a + b;
    else if (op === '-') answer = a - b;
    else answer = a * b;
    await saveState(chatId, user.tgId, 'game:math', { answer });
    await render(chatId, messageId, t(lang, 'math_prompt', { a, op, b }));
  },
  async onText({ user, lang, chatId, data, text }) {
    const n = parseInt(String(text).trim(), 10);
    if (!Number.isFinite(n)) {
      await sendMessage(chatId, t(lang, 'number_invalid'));
      return;
    }
    await clearState(chatId);
    const win = n === data.answer;
    const reward = win ? WIN_REWARD : 0;
    await settle({
      user, lang, gameId: 'math',
      result: win ? 'win' : 'lose', reward,
      text: win
        ? t(lang, 'math_correct', { reward, currency: CURRENCY })
        : t(lang, 'math_wrong', { answer: data.answer }),
      chatId,
    });
  },
};
