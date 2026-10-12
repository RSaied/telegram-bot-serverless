import { t } from '../i18n.js';
import { pick } from '../format.js';
import { CURRENCY, WIN_REWARD } from '../config.js';
import { settle } from './kit.js';

const SYMBOLS = ['🍒', '🍋', '🍇', '🍉', '⭐', '🍀'];

export default {
  id: 'slots',
  emoji: '🍒',
  nameKey: 'g_slots',
  reward: WIN_REWARD,
  instant: true,
  async play({ user, lang, chatId, messageId }) {
    const r = [pick(SYMBOLS), pick(SYMBOLS), pick(SYMBOLS)];
    let result = 'lose';
    let reward = 0;

    if (r[0] === r[1] && r[1] === r[2]) {
      result = 'win';
      reward = WIN_REWARD * (r[0] === '⭐' || r[0] === '🍀' ? 4 : 2);
    } else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) {
      result = 'win';
      reward = WIN_REWARD;
    }

    const line = `${t(lang, 'slots_spin')}\n\n║ ${r[0]} │ ${r[1]} │ ${r[2]} ║`;
    const outcome =
      result === 'win'
        ? '\n\n' + t(lang, 'slots_win', { reward, currency: CURRENCY })
        : '\n\n' + t(lang, 'you_lost');
    await settle({ user, lang, gameId: 'slots', result, reward, text: line + outcome, chatId, messageId });
  },
};
