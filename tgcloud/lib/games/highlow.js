import { t } from '../i18n.js';
import { randomInt } from '../format.js';
import { CURRENCY, WIN_REWARD } from '../config.js';
import { settle, saveState, clearState } from './kit.js';
import { render, answerCallback } from '../ui.js';

export default {
  id: 'highlow',
  emoji: '⬆️',
  nameKey: 'g_highlow',
  reward: WIN_REWARD,
  async start({ user, lang, chatId, messageId }) {
    const n = randomInt(1, 50);
    await saveState(chatId, user.tgId, 'game:highlow', { n });
    await render(chatId, messageId, t(lang, 'highlow_prompt', { n }), {
      reply_markup: {
        inline_keyboard: [
          [
            { text: t(lang, 'highlow_higher'), callback_data: 'highlow:higher' },
            { text: t(lang, 'highlow_lower'), callback_data: 'highlow:lower' },
          ],
        ],
      },
    });
  },
  async onCallback({ user, lang, chatId, messageId, data, value, callbackQueryId }) {
    let next = randomInt(1, 50);
    while (next === data.n) next = randomInt(1, 50);
    const win = (value === 'higher' && next > data.n) || (value === 'lower' && next < data.n);
    const reward = win ? WIN_REWARD : 0;
    await clearState(chatId);
    await answerCallback(callbackQueryId, win ? '🎉' : '😔');
    await settle({
      user, lang, gameId: 'highlow', result: win ? 'win' : 'lose', reward,
      text: t(lang, 'highlow_result', {
        next,
        outcome: win
          ? t(lang, 'you_won', { reward, currency: CURRENCY })
          : t(lang, 'you_lost'),
      }),
      chatId,
      messageId,
    });
  },
};
