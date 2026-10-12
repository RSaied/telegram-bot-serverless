import { t } from '../i18n.js';
import { pick, shuffle } from '../format.js';
import { CURRENCY, BIG_WIN_REWARD } from '../config.js';
import { settle, saveState, clearState } from './kit.js';
import { render } from '../ui.js';
import { WORDS_AR, WORDS_EN } from './data.js';

function scramble(word) {
  if (word.length < 3) return word;
  let out = shuffle(word.split('')).join('');
  if (out === word) out = shuffle(word.split('')).join('');
  return out;
}

export default {
  id: 'word',
  emoji: '🔤',
  nameKey: 'g_word',
  reward: BIG_WIN_REWARD,
  async start({ user, lang, chatId, messageId }) {
    const list = lang === 'ar' ? WORDS_AR : WORDS_EN;
    const answer = pick(list);
    await saveState(chatId, user.tgId, 'game:word', { answer });
    await render(chatId, messageId, t(lang, 'word_prompt', { scrambled: scramble(answer) }));
  },
  async onText({ user, lang, chatId, data, text }) {
    const guess = String(text).trim().toLowerCase();
    const win = guess === String(data.answer).toLowerCase();
    await clearState(chatId);
    const reward = win ? BIG_WIN_REWARD : 0;
    await settle({
      user, lang, gameId: 'word',
      result: win ? 'win' : 'lose', reward,
      text: win
        ? t(lang, 'word_correct', { reward, currency: CURRENCY })
        : t(lang, 'word_wrong', { answer: data.answer }),
      chatId,
    });
  },
};
