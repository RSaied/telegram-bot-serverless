import { t } from '../i18n.js';
import { randomInt } from '../format.js';
import { CURRENCY, BIG_WIN_REWARD } from '../config.js';
import { settle, saveState, clearState } from './kit.js';
import { render, sendMessage } from '../ui.js';

const TRIES = 7;

export default {
  id: 'guess',
  emoji: '🔢',
  nameKey: 'g_guess',
  reward: BIG_WIN_REWARD,
  async start({ user, lang, chatId, messageId }) {
    const secret = randomInt(1, 100);
    await saveState(chatId, user.tgId, 'game:guess', { secret, tries: TRIES });
    await render(chatId, messageId, t(lang, 'guess_prompt', { tries: TRIES }));
  },
  async onText({ user, lang, chatId, data, text }) {
    const n = parseInt(String(text).trim(), 10);
    if (!Number.isFinite(n)) {
      await sendMessage(chatId, t(lang, 'number_invalid'));
      return;
    }
    if (n === data.secret) {
      await clearState(chatId);
      const reward = BIG_WIN_REWARD;
      await settle({
        user, lang, gameId: 'guess', result: 'win', reward,
        text: t(lang, 'guess_won', { n, reward, currency: CURRENCY }), chatId,
      });
      return;
    }
    const tries = data.tries - 1;
    if (tries <= 0) {
      await clearState(chatId);
      await settle({
        user, lang, gameId: 'guess', result: 'lose', reward: 0,
        text: t(lang, 'guess_lost', { n: data.secret }), chatId,
      });
      return;
    }
    await saveState(chatId, user.tgId, 'game:guess', { ...data, tries });
    await sendMessage(chatId, t(lang, n > data.secret ? 'guess_lower' : 'guess_higher', { tries }));
  },
};
