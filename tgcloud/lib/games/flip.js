import { t } from '../i18n.js';
import { pick } from '../format.js';
import { CURRENCY, WIN_REWARD } from '../config.js';
import { settle, saveState } from './kit.js';
import { render, answerCallback } from '../ui.js';

export default {
  id: 'flip',
  emoji: '🪙',
  nameKey: 'g_flip',
  reward: WIN_REWARD,
  async start({ user, lang, chatId, messageId }) {
    await saveState(chatId, user.tgId, 'game:flip', {});
    await render(chatId, messageId, t(lang, 'flip_prompt'), {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🪙 ' + t(lang, 'flip_heads'), callback_data: 'flip:heads' },
            { text: '🪙 ' + t(lang, 'flip_tails'), callback_data: 'flip:tails' },
          ],
        ],
      },
    });
  },
  async onCallback({ user, lang, chatId, messageId, data, value, callbackQueryId }) {
    const side = pick(['heads', 'tails']);
    const win = value === side;
    const result = win ? 'win' : 'lose';
    const reward = win ? WIN_REWARD : 0;
    const sideName = side === 'heads' ? t(lang, 'flip_heads') : t(lang, 'flip_tails');
    const outcome = win
      ? t(lang, 'you_won', { reward, currency: CURRENCY })
      : t(lang, 'you_lost');
    await answerCallback(callbackQueryId, win ? '🎉' : '😔');
    await settle({
      user,
      lang,
      gameId: 'flip',
      result,
      reward,
      text: t(lang, 'flip_result', { side: sideName, outcome }),
      chatId,
      messageId,
    });
  },
};
