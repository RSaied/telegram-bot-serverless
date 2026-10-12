import { t } from './i18n.js';
import { gameById } from './games/index.js';
import { isGameEnabled } from './settings.js';
import { sendMessage } from './ui.js';

/**
 * Launch a free game (no bet). Returns true if launched.
 */
export async function startGame({ user, lang, chatId, gameId, messageId }) {
  const game = gameById(gameId);
  if (!game) return false;
  if (!(await isGameEnabled(gameId))) {
    await sendMessage(chatId, t(lang, 'game_disabled'));
    return false;
  }
  if (game.instant) {
    await game.play({ user, lang, chatId, messageId });
  } else {
    await game.start({ user, lang, chatId, messageId });
  }
  return true;
}
