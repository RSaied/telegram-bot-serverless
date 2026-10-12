import { t } from '../i18n.js';
import { pick, shuffle } from '../format.js';
import { CURRENCY, WIN_REWARD } from '../config.js';
import { settle, saveState, clearState } from './kit.js';
import { render, answerCallback } from '../ui.js';
import { QUIZ } from './data.js';

export default {
  id: 'quiz',
  emoji: '❓',
  nameKey: 'g_quiz',
  reward: WIN_REWARD,
  async start({ user, lang, chatId, messageId }) {
    const def = pick(QUIZ);
    const correct = def.a[lang] || def.a.en;
    const wrongs = (def.wrong[lang] || def.wrong.en).slice(0, 3);
    const options = shuffle([correct, ...wrongs]);
    const correctIndex = options.indexOf(correct);
    await saveState(chatId, user.tgId, 'game:quiz', { correctIndex, correct, options });

    const numbered = options.map((o, i) => `${i + 1}. ${o}`).join('\n');
    await render(chatId, messageId, t(lang, 'quiz_question', { q: def.q[lang] || def.q.en, options: numbered }), {
      reply_markup: {
        inline_keyboard: options.map((o, i) => [{ text: o, callback_data: `quiz:${i}` }]),
      },
    });
  },
  async onCallback({ user, lang, chatId, messageId, data, value, callbackQueryId }) {
    const idx = parseInt(value, 10);
    const win = idx === data.correctIndex;
    const reward = win ? WIN_REWARD : 0;
    await clearState(chatId);
    await answerCallback(callbackQueryId, win ? '🎉' : '❌');
    await settle({
      user, lang, gameId: 'quiz',
      result: win ? 'win' : 'lose', reward,
      text: win
        ? t(lang, 'quiz_correct', { reward, currency: CURRENCY })
        : t(lang, 'quiz_wrong', { answer: data.correct }),
      chatId,
      messageId,
    });
  },
};
