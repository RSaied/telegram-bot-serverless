import { t } from '../i18n.js';
import { randomInt } from '../format.js';
import { CURRENCY, WIN_REWARD } from '../config.js';
import { settle } from './kit.js';

export default {
  id: 'dice',
  emoji: '🔢',
  nameKey: 'g_dice',
  reward: WIN_REWARD,
  instant: true,
  async play({ user, lang, chatId, messageId }) {
    const you = randomInt(1, 6);
    const bot = randomInt(1, 6);
    let result = 'draw';
    let reward = 0;
    if (you > bot) {
      result = 'win';
      reward = WIN_REWARD;
    } else if (you < bot) {
      result = 'lose';
    }
    const line = t(lang, 'dice_roll', { you, bot });
    const outcome =
      result === 'win'
        ? '\n\n' + t(lang, 'you_won', { reward, currency: CURRENCY })
        : result === 'lose'
          ? '\n\n' + t(lang, 'you_lost')
          : '\n\n' + t(lang, 'draw');
    await settle({ user, lang, gameId: 'dice', result, reward, text: line + outcome, chatId, messageId });
  },
};
