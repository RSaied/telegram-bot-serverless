import { t } from '../i18n.js';
import { CURRENCY, BIG_WIN_REWARD } from '../config.js';
import { settle, saveState, clearState } from './kit.js';
import { render, answerCallback } from '../ui.js';

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winner(b) {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return null;
}

function full(b) {
  return b.every((x) => x);
}

function boardText(b) {
  const cell = (v) => (v === 'X' ? '❌' : v === 'O' ? '⭕' : '⬜');
  return [
    cell(b[0]) + cell(b[1]) + cell(b[2]),
    cell(b[3]) + cell(b[4]) + cell(b[5]),
    cell(b[6]) + cell(b[7]) + cell(b[8]),
  ].join('\n');
}

function keyboard(b) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = [];
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      row.push({
        text: b[i] === 'X' ? '❌' : b[i] === 'O' ? '⭕' : '▶️',
        callback_data: b[i] ? 'ttt:noop' : `ttt:${i}`,
      });
    }
    rows.push(row);
  }
  return { inline_keyboard: rows };
}

function botMove(b) {
  for (const line of LINES) {
    const vals = line.map((i) => b[i]);
    if (vals.filter((v) => v === 'O').length === 2 && vals.includes(null)) {
      return line[vals.indexOf(null)];
    }
  }
  for (const line of LINES) {
    const vals = line.map((i) => b[i]);
    if (vals.filter((v) => v === 'X').length === 2 && vals.includes(null)) {
      return line[vals.indexOf(null)];
    }
  }
  if (!b[4]) return 4;
  const empty = b.map((v, i) => (v ? null : i)).filter((i) => i !== null);
  return empty[Math.floor(Math.random() * empty.length)];
}

export default {
  id: 'tictactoe',
  emoji: '❌',
  nameKey: 'g_tictactoe',
  reward: BIG_WIN_REWARD,
  async start({ user, lang, chatId, messageId }) {
    const board = Array(9).fill(null);
    await saveState(chatId, user.tgId, 'game:tictactoe', { board });
    await render(chatId, messageId, boardText(board) + '\n\n' + t(lang, 'ttt_your_turn'), {
      reply_markup: keyboard(board),
    });
  },
  async onCallback({ user, lang, chatId, messageId, data, value, callbackQueryId }) {
    if (value === 'noop') {
      await answerCallback(callbackQueryId, '⛔');
      return;
    }
    const board = data.board.slice();
    const idx = parseInt(value, 10);
    if (board[idx]) {
      await answerCallback(callbackQueryId, '⛔');
      return;
    }
    board[idx] = 'X';

    if (winner(board) === 'X') {
      await clearState(chatId);
      const reward = BIG_WIN_REWARD;
      await answerCallback(callbackQueryId, '🎉');
      await settle({
        user, lang, gameId: 'tictactoe', result: 'win', reward,
        text: boardText(board) + '\n\n' + t(lang, 'ttt_win', { reward, currency: CURRENCY }),
        chatId, messageId,
      });
      return;
    }
    if (full(board)) {
      await clearState(chatId);
      await answerCallback(callbackQueryId, '🤝');
      await settle({
        user, lang, gameId: 'tictactoe', result: 'draw', reward: 0,
        text: boardText(board) + '\n\n' + t(lang, 'ttt_draw'), chatId, messageId,
      });
      return;
    }

    board[botMove(board)] = 'O';
    if (winner(board) === 'O') {
      await clearState(chatId);
      await answerCallback(callbackQueryId, '😔');
      await settle({
        user, lang, gameId: 'tictactoe', result: 'lose', reward: 0,
        text: boardText(board) + '\n\n' + t(lang, 'ttt_lose'), chatId, messageId,
      });
      return;
    }
    if (full(board)) {
      await clearState(chatId);
      await answerCallback(callbackQueryId, '🤝');
      await settle({
        user, lang, gameId: 'tictactoe', result: 'draw', reward: 0,
        text: boardText(board) + '\n\n' + t(lang, 'ttt_draw'), chatId, messageId,
      });
      return;
    }

    await saveState(chatId, user.tgId, 'game:tictactoe', { board });
    await answerCallback(callbackQueryId);
    await render(chatId, messageId, boardText(board) + '\n\n' + t(lang, 'ttt_your_turn'), {
      reply_markup: keyboard(board),
    });
  },
};
