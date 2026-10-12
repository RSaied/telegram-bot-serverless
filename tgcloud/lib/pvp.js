import { t } from './i18n.js';
import { randomInt, escapeMd } from './format.js';
import * as db from './db.js';
import { editInline, answerCallback } from './ui.js';
import { WIN_REWARD, BIG_WIN_REWARD, LOSS_PENALTY_RATIO } from './config.js';

const TTT_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const RPS_ICONS = { rock: '✊', paper: '✋', scissors: '✌️' };

export function tokenId() {
  return randomInt(100000000, 899999999);
}

function tttWinner(b) {
  for (const [a, c, d] of TTT_LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return null;
}

function tttFull(b) {
  return b.every((x) => x);
}

function tttBoardText(b) {
  const cell = (v) => (v === 'X' ? '❌' : v === 'O' ? '⭕' : '⬜');
  return [cell(b[0]) + cell(b[1]) + cell(b[2]), cell(b[3]) + cell(b[4]) + cell(b[5]), cell(b[6]) + cell(b[7]) + cell(b[8])].join('\n');
}

function tttKeyboard(s, token) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = [];
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      row.push({
        text: s.board[i] === 'X' ? '❌' : s.board[i] === 'O' ? '⭕' : '▶️',
        callback_data: s.board[i] ? `pvp:busy:${token}` : `pvp:cell:${token}:${i}`,
      });
    }
    rows.push(row);
  }
  return { inline_keyboard: rows };
}

function rpsKeyboard(token) {
  return {
    inline_keyboard: [
      [
        { text: '✊', callback_data: `pvp:pick:${token}:rock` },
        { text: '✋', callback_data: `pvp:pick:${token}:paper` },
        { text: '✌️', callback_data: `pvp:pick:${token}:scissors` },
      ],
    ],
  };
}

function turnText(s) {
  const cur = s.turn === 'p1' ? s.p1 : s.p2;
  return '❌ ' + s.p1.name + ' • ⭕ ' + s.p2.name + '\n👉 ' + cur.name;
}

export async function handle({ action, token, value, user, callbackQueryId, inlineMessageId }) {
  const session = await db.getSession(token);

  // Seat 1: the first presser hosts the room until a friend joins.
  if (action === 'join' && !session) {
    const gameId = String(value).split(':')[0] || 'tictactoe';
    const s = {
      game: gameId,
      p1: { id: user.id, name: escapeMd(user.name) },
      p2: null,
      phase: 'lobby',
      turn: 'p1',
      board: Array(9).fill(null),
      moves: { p1: null, p2: null },
      inline: inlineMessageId,
      lang1: user.lang || 'ar',
      lang2: user.lang || 'ar',
    };
    await db.setSession(token, user.id, `pvp:${gameId}`, s);
    await editInline(inlineMessageId, t(s.lang1, 'pvp_lobby', { name: escapeMd(user.name) }), {
      reply_markup: { inline_keyboard: [[{ text: t(s.lang1, 'inl_join'), callback_data: `pvp:join:${token}:${gameId}` }]] },
    });
    return answerCallback(callbackQueryId, '🎮');
  }

  if (!session || session.kind !== 'pvp:tictactoe' && session.kind !== 'pvp:rps') {
    await answerCallback(callbackQueryId, '⌛', { show_alert: false });
    return;
  }
  const s = session.data;
  s.inline = inlineMessageId || s.inline;
  const p1 = s.p1;
  const p2 = s.p2;

  if (action === 'join') {
    if (s.phase !== 'lobby' || p2) return answerCallback(callbackQueryId, '⛔');
    if (user.id === p1.id) return answerCallback(callbackQueryId, '⛔');
    s.p2 = { id: user.id, name: escapeMd(user.name) };
    s.lang2 = user.lang || s.lang1;
    s.phase = 'play';
    s.moves = { p1: null, p2: null };
    s.board = Array(9).fill(null);
    s.turn = 'p1';
    await db.setSession(token, user.id, session.kind, s);

    const out =
      session.kind === 'pvp:tictactoe'
        ? tttBoardText(s.board) + '\n\n' + turnText(s)
        : `🎮 ${t(s.lang1, 'inl_pvp')}\n\n✊ ${p1.name} • ✌️ ${s.p2.name}`;
    const kb = session.kind === 'pvp:tictactoe' ? tttKeyboard(s, token) : rpsKeyboard(token);
    await editInline(s.inline, out, { reply_markup: kb });
    return answerCallback(callbackQueryId, '🎮');
  }

  const isP1 = user.id === p1.id;
  const isP2 = p2 && user.id === p2.id;
  if (!isP1 && !isP2) {
    await answerCallback(callbackQueryId, '⛔');
    return;
  }

  if (action === 'again') {
    return answerCallback(callbackQueryId, '⛔');
  }

  if (session.kind === 'pvp:tictactoe' && action === 'cell') {
    if (s.phase !== 'play') return answerCallback(callbackQueryId, '⛔');
    const turnId = s.turn === 'p1' ? p1.id : p2.id;
    if (user.id !== turnId) return answerCallback(callbackQueryId, '⛔');
    const idx = parseInt(value, 10);
    if (!Number.isFinite(idx) || idx < 0 || idx > 8 || s.board[idx]) return answerCallback(callbackQueryId, '⛔');
    const symbol = s.turn === 'p1' ? 'X' : 'O';
    s.board[idx] = symbol;

    const w = tttWinner(s.board);
    if (w) return finalize(s, token, session.kind, callbackQueryId, w === 'X' ? 'p1' : 'p2');
    if (tttFull(s.board)) return finalize(s, token, session.kind, callbackQueryId, null);

    s.turn = s.turn === 'p1' ? 'p2' : 'p1';
    await db.setSession(token, user.id, session.kind, s);
    await editInline(s.inline, tttBoardText(s.board) + '\n\n' + turnText(s), {
      reply_markup: tttKeyboard(s, token),
    });
    return answerCallback(callbackQueryId, '🎮');
  }

  if (session.kind === 'pvp:rps' && action === 'pick') {
    if (s.phase !== 'play') return answerCallback(callbackQueryId, '⛔');
    const slot = isP1 ? 'p1' : 'p2';
    if (s.moves[slot]) return answerCallback(callbackQueryId, '⛔');
    s.moves[slot] = value;

    if (!s.moves.p1 || !s.moves.p2) {
      await db.setSession(token, user.id, session.kind, s);
      return answerCallback(callbackQueryId, '✔');
    }
    return finalize(s, token, session.kind, callbackQueryId);
  }

  return answerCallback(callbackQueryId, '⛔');
}

async function finalize(s, token, kind, callbackQueryId, tttWinnerSide = null) {
  const p1 = s.p1;
  const p2 = s.p2;
  const rpsGame = kind === 'pvp:rps';
  let winner = null;
  let draw = false;

  if (rpsGame) {
    const a = s.moves.p1;
    const b = s.moves.p2;
    if (a === b) draw = true;
    else winner = { rock: 'scissors', paper: 'rock', scissors: 'paper' }[a] === b ? 'p1' : 'p2';
  } else if (tttWinnerSide) {
    winner = tttWinnerSide;
  } else {
    draw = true;
  }

  const reward = rpsGame ? WIN_REWARD : BIG_WIN_REWARD;
  let head;
  if (draw) {
    head = '🤝';
    await db.recordGame(p1.id, rpsGame ? 'rps' : 'tictactoe', 'draw', 0);
    await db.recordGame(p2.id, rpsGame ? 'rps' : 'tictactoe', 'draw', 0);
  } else {
    const w = winner === 'p1' ? p1 : p2;
    const l = winner === 'p1' ? p2 : p1;
    head = `🎉 ${w.name}`;
    await db.addCoins(w.id, reward);
    await db.recordGame(w.id, rpsGame ? 'rps' : 'tictactoe', 'win', reward);
    await db.deductCoins(l.id, Math.round(reward * LOSS_PENALTY_RATIO));
    await db.recordGame(l.id, rpsGame ? 'rps' : 'tictactoe', 'lose', 0);
  }

  s.phase = 'done';
  await db.setSession(token, s.p1.id, kind, s);

  const body = rpsGame
    ? `${RPS_ICONS[s.moves.p1]} ${p1.name} • ${RPS_ICONS[s.moves.p2]} ${p2.name}`
    : tttBoardText(s.board) + '\n\n❌ ' + p1.name + ' • ⭕ ' + p2.name;

  await editInline(s.inline, `${body}\n\n${head}`);
  await answerCallback(callbackQueryId, draw ? '🤝' : '🎉');
}