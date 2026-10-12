import { t } from '../i18n.js';
import { pick } from '../format.js';
import { CURRENCY, WIN_REWARD } from '../config.js';
import { settle, saveState } from './kit.js';
import { render, answerCallback } from '../ui.js';

const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
const LABELS = { rock: 'rps_rock', paper: 'rps_paper', scissors: 'rps_scissors' };

export default {
  id: 'rps',
  emoji: '✊',
  nameKey: 'g_rps',
  reward: WIN_REWARD,
  async start({ user, lang, chatId, messageId }) {
    await saveState(chatId, user.tgId, 'game:rps', {});
    await render(chatId, messageId, t(lang, 'rps_prompt'), {
      reply_markup: {
        inline_keyboard: [
          [
            { text: t(lang, 'rps_rock'), callback_data: 'rps:rock' },
            { text: t(lang, 'rps_paper'), callback_data: 'rps:paper' },
            { text: t(lang, 'rps_scissors'), callback_data: 'rps:scissors' },
          ],
        ],
      },
    });
  },
  async onCallback({ user, lang, chatId, messageId, data, value, callbackQueryId }) {
    const bot = pick(['rock', 'paper', 'scissors']);
    let result;
    if (value === bot) result = 'draw';
    else if (BEATS[value] === bot) result = 'win';
    else result = 'lose';

    const reward = result === 'win' ? WIN_REWARD : 0;
    const outcome =
      result === 'win'
        ? t(lang, 'you_won', { reward, currency: CURRENCY })
        : result === 'lose'
          ? t(lang, 'you_lost')
          : t(lang, 'draw');
    await answerCallback(callbackQueryId, result === 'win' ? '🎉' : result === 'lose' ? '😔' : '🤝');
    await settle({
      user,
      lang,
      gameId: 'rps',
      result,
      reward,
      text: t(lang, 'rps_result', {
        you: t(lang, LABELS[value]),
        bot: t(lang, LABELS[bot]),
        outcome,
      }),
      chatId,
      messageId,
    });
  },
};
