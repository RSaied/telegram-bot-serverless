import { t } from './i18n.js';
import { CURRENCY, WIN_REWARD, BIG_WIN_REWARD, LOSS_PENALTY_RATIO } from './config.js';
import { randomInt, pick, shuffle } from './format.js';
import * as db from './db.js';
import { editInline, answerCallback } from './ui.js';
import { checkAfterGame } from './achievements.js';
import { QUIZ, WORDS_AR, WORDS_EN } from './games/data.js';
import { gameById } from './games/index.js';

const TTT_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
const RPS_KEYS = { rock: 'rps_rock', paper: 'rps_paper', scissors: 'rps_scissors' };
const SYMBOLS = ['🍒', '🍋', '🍇', '🍉', '⭐', '🍀'];
const OPS = ['+', '-', '×'];
const GUESS_TRIES = 7;

export function ibToken() {
  return randomInt(10000000, 79999999);
}

function againKb(lang, token, gameId) {
  return { inline_keyboard: [[{ text: t(lang, 'play_again'), callback_data: `ibp:again:${token}:${gameId}` }]] };
}

function manyKb(gameId, token, labels) {
  return {
    inline_keyboard: labels.map((l) => [{ text: l.label, callback_data: `ibp:${gameId}:${token}:${l.value}` }]),
  };
}

async function rewardText(user, lang, gameId, result, reward, text) {
  if (result === 'win' && reward > 0) await db.addCoins(user.tgId, reward);

  let penalty = 0;
  if (result === 'lose') {
    const base = gameById(gameId)?.reward || WIN_REWARD;
    penalty = await db.deductCoins(user.tgId, Math.round(base * LOSS_PENALTY_RATIO));
  }

  await db.recordGame(user.tgId, gameId, result, reward);
  const unlocked = await checkAfterGame(user, { reward, won: result === 'win' });
  let out = text;
  if (penalty > 0) out += '\n' + t(lang, 'loss_penalty', { amount: penalty, currency: CURRENCY });
  if (unlocked.length) {
    const names = unlocked.map((a) => `${a.emoji} ${lang === 'ar' ? a.ar : a.en}`).join(', ');
    out += `\n\n🏅 ${names}`;
  }
  return out;
}

function numbered(list) {
  return list.map((o, i) => `${i + 1}. ${o}`).join('\n');
}

function tttWin(b) {
  for (const [a, c, d] of TTT_LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return null;
}

function tttFull(b) {
  return b.every((x) => x);
}

function tttText(b) {
  const c = (v) => (v === 'X' ? '❌' : v === 'O' ? '⭕' : '⬜');
  return [c(b[0]) + c(b[1]) + c(b[2]), c(b[3]) + c(b[4]) + c(b[5]), c(b[6]) + c(b[7]) + c(b[8])].join('\n');
}

function tttBotMove(b) {
  for (const line of TTT_LINES) {
    const vals = line.map((i) => b[i]);
    if (vals.filter((v) => v === 'O').length === 2 && vals.includes(null)) return line[vals.indexOf(null)];
  }
  for (const line of TTT_LINES) {
    const vals = line.map((i) => b[i]);
    if (vals.filter((v) => v === 'X').length === 2 && vals.includes(null)) return line[vals.indexOf(null)];
  }
  if (!b[4]) return 4;
  const empty = b.map((v, i) => (v ? null : i)).filter((i) => i !== null);
  return empty[Math.floor(Math.random() * empty.length)];
}

function tttKb(gameId, token, b) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = [];
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      row.push({
        text: b[i] === 'X' ? '❌' : b[i] === 'O' ? '⭕' : '▶️',
        callback_data: b[i] ? `ibp:${gameId}:${token}:noop` : `ibp:${gameId}:${token}:${i}`,
      });
    }
    rows.push(row);
  }
  return { inline_keyboard: rows };
}

function scramble(word) {
  if (word.length < 3) return word;
  let out = shuffle(word.split('')).join('');
  if (out === word) out = shuffle(word.split('')).join('');
  return out;
}

function newChoices(include, count, min, max) {
  const set = new Set([include]);
  let guard = 0;
  while (set.size < count && guard++ < 200) set.add(randomInt(min, max));
  return shuffle([...set]);
}

// ---- build the initial prompt for a choice/board game ----
function promptRequest(gameId, data, lang, token) {
  const emoji = gameById(gameId) ? gameById(gameId).emoji : '🎮';
  if (gameId === 'tictactoe') {
    return { text: tttText(data.board) + '\n\n' + t(lang, 'ttt_your_turn'), kb: tttKb(gameId, token, data.board) };
  }
  if (gameId === 'rps') {
    return {
      text: emoji + ' ' + t(lang, 'rps_prompt'),
      kb: manyKb(gameId, token, [
        { label: t(lang, 'rps_rock'), value: 'rock' },
        { label: t(lang, 'rps_paper'), value: 'paper' },
        { label: t(lang, 'rps_scissors'), value: 'scissors' },
      ]),
    };
  }
  if (gameId === 'flip') {
    return {
      text: emoji + ' ' + t(lang, 'flip_prompt'),
      kb: manyKb(gameId, token, [
        { label: '🪙 ' + t(lang, 'flip_heads'), value: 'heads' },
        { label: '🪙 ' + t(lang, 'flip_tails'), value: 'tails' },
      ]),
    };
  }
  if (gameId === 'highlow') {
    return {
      text: t(lang, 'highlow_prompt', { n: data.n }),
      kb: manyKb(gameId, token, [
        { label: t(lang, 'highlow_higher'), value: 'higher' },
        { label: t(lang, 'highlow_lower'), value: 'lower' },
      ]),
    };
  }
  if (gameId === 'quiz') {
    const numberedOptions = numbered(data.options);
    return {
      text: t(lang, 'quiz_question', { q: data.q, options: numberedOptions }),
      kb: manyKb(gameId, token, data.options.map((o, i) => ({ label: o, value: i }))),
    };
  }
  if (gameId === 'math') {
    return {
      text: t(lang, 'math_prompt', { a: data.a, op: data.op, b: data.b }) + '\n\n' + numbered(data.options),
      kb: manyKb(gameId, token, data.options.map((o, i) => ({ label: String(o), value: i }))),
    };
  }
  if (gameId === 'guess') {
    return {
      text: t(lang, 'guess_prompt', { tries: data.tries }) + '\n\n' + numbered(data.options),
      kb: manyKb(gameId, token, data.options.map((o, i) => ({ label: String(o), value: i }))),
    };
  }
  if (gameId === 'word') {
    return {
      text: t(lang, 'word_prompt', { scrambled: data.scrambled }) + '\n\n' + numbered(data.options),
      kb: manyKb(gameId, token, data.options.map((o, i) => ({ label: o, value: i }))),
    };
  }
  return { text: '🎮', kb: {} };
}

function freshData(gameId, lang) {
  if (gameId === 'tictactoe') return { board: Array(9).fill(null) };
  if (gameId === 'rps' || gameId === 'flip') return {};
  if (gameId === 'highlow') return { n: randomInt(1, 50) };
  if (gameId === 'quiz') {
    const def = pick(QUIZ);
    const correct = def.a[lang] || def.a.en;
    const wrongs = (def.wrong[lang] || def.wrong.en).slice(0, 3);
    const options = shuffle([correct, ...wrongs]);
    return { q: def.q[lang] || def.q.en, options, correctIndex: options.indexOf(correct) };
  }
  if (gameId === 'math') {
    const op = OPS[randomInt(0, OPS.length - 1)];
    const b = randomInt(2, 20);
    const a = op === '-' ? randomInt(b + 1, 30) : randomInt(2, 30);
    const ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
    const options = [];
    const seen = new Set([ans]);
    for (const d of [1, 2, 3, 5]) {
      if (seen.has(ans + d)) continue;
      if (ans + d >= 0) { seen.add(ans + d); options.push(ans + d); }
      if (options.length >= 3) break;
    }
    while (options.length < 3) {
      const v = randomInt(Math.max(0, ans - 10), ans + 10);
      if (!seen.has(v)) { seen.add(v); options.push(v); }
    }
    return { op, a, b, options: shuffle([ans, ...options]) };
  }
  if (gameId === 'guess') {
    const secret = randomInt(1, 100);
    return { secret, tries: GUESS_TRIES, options: newChoices(secret, 4, 1, 100) };
  }
  if (gameId === 'word') {
    const list = lang === 'ar' ? WORDS_AR : WORDS_EN;
    const answer = pick(list);
    const options = newChoices(list.indexOf(answer), 4, 0, list.length - 1).map((i) => list[i]);
    return { answer, options, scrambled: scramble(answer) };
  }
  return {};
}

// ---- entry from the "Start" button on the inline result ----
export async function start({ gameId, token, user, lang, inlineMessageId, callbackQueryId }) {
  if (gameId === 'dice') return instantRoll('dice', user, lang, inlineMessageId, callbackQueryId, token);
  if (gameId === 'slots') return instantSlots(user, lang, inlineMessageId, callbackQueryId, token);

  const data = freshData(gameId, lang);
  await db.setSession(token, user.tgId, `ibp:${gameId}`, { ...data, lang, inline: inlineMessageId, token });
  const p = promptRequest(gameId, data, lang, token);
  await editInline(inlineMessageId, p.text, { reply_markup: p.kb });
  return answerCallback(callbackQueryId, '🎮');
}

async function instantRoll(gameId, user, lang, inlineMessageId, callbackQueryId, token) {
  const you = randomInt(1, 6);
  const bot = randomInt(1, 6);
  let result = 'draw';
  let reward = 0;
  if (you > bot) { result = 'win'; reward = WIN_REWARD; }
  else if (you < bot) { result = 'lose'; }
  const outcome =
    result === 'win' ? '\n\n' + t(lang, 'you_won', { reward, currency: CURRENCY })
    : result === 'lose' ? '\n\n' + t(lang, 'you_lost')
    : '\n\n' + t(lang, 'draw');
  const text = await rewardText(user, lang, 'dice', result, reward, t(lang, 'dice_roll', { you, bot }) + outcome);
  await editInline(inlineMessageId, '🔢 ' + text, { reply_markup: againKb(lang, token, 'dice') });
  return answerCallback(callbackQueryId, result === 'win' ? '🎉' : result === 'lose' ? '😔' : '🤝');
}

async function instantSlots(user, lang, inlineMessageId, callbackQueryId, token) {
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
  const outcome = result === 'win' ? '\n\n' + t(lang, 'slots_win', { reward, currency: CURRENCY }) : '\n\n' + t(lang, 'you_lost');
  const text = await rewardText(user, lang, 'slots', result, reward, line + outcome);
  await editInline(inlineMessageId, '🍒 ' + text, { reply_markup: againKb(lang, token, 'slots') });
  return answerCallback(callbackQueryId, result === 'win' ? '🎉' : '😔');
}

// ---- one move / answer / rematch ----
export async function move({ action, gameId, token, value, user, lang, inlineMessageId, callbackQueryId }) {
  if (action === 'again') {
    const gid = String(value).split(':')[0];
    if (!gid || !gameById(gid)) return answerCallback(callbackQueryId, '⌛', { show_alert: false });
    if (gid === 'dice') return instantRoll('dice', user, lang, inlineMessageId, callbackQueryId, token);
    if (gid === 'slots') return instantSlots(user, lang, inlineMessageId, callbackQueryId, token);
    const data = freshData(gid, lang);
    await db.setSession(token, user.tgId, `ibp:${gid}`, { ...data, lang, inline: inlineMessageId, token });
    const p = promptRequest(gid, data, lang, token);
    await editInline(inlineMessageId, p.text, { reply_markup: p.kb });
    return answerCallback(callbackQueryId, '🔄');
  }

  const session = await db.getSession(token);
  if (!session || session.kind !== `ibp:${gameId}`) return answerCallback(callbackQueryId, '⌛', { show_alert: false });
  if (session.userId && session.userId !== user.tgId) return answerCallback(callbackQueryId, '⛔');
  const s = session.data;
  s.inline = inlineMessageId || s.inline;
  s.lang = s.lang || lang;

  if (gameId === 'tictactoe') return tttMove({ gameId, token, s, value, user, lang: s.lang, callbackQueryId });
  if (gameId === 'rps') return rpsMove({ gameId, token, s, value, user, lang: s.lang, callbackQueryId });
  if (gameId === 'flip') return flipMove({ gameId, token, s, value, user, lang: s.lang, callbackQueryId });
  if (gameId === 'highlow') return highlowMove({ gameId, token, s, value, user, lang: s.lang, callbackQueryId });
  if (gameId === 'quiz') return quizMove({ gameId, token, s, value, user, lang: s.lang, callbackQueryId });
  if (gameId === 'math') return mathMove({ gameId, token, s, value, user, lang: s.lang, callbackQueryId });
  if (gameId === 'guess') return guessMove({ gameId, token, s, value, user, lang: s.lang, callbackQueryId });
  if (gameId === 'word') return wordMove({ gameId, token, s, value, user, lang: s.lang, callbackQueryId });
  return answerCallback(callbackQueryId, '⛔');
}

async function finish(s, user, gameId, result, reward, body, callbackQueryId) {
  const text = await rewardText(user, s.lang, gameId, result, reward, body);
  await editInline(s.inline, text, { reply_markup: againKb(s.lang, s.token, gameId) });
  await answerCallback(callbackQueryId, result === 'win' ? '🎉' : result === 'draw' ? '🤝' : '😔');
}

async function tttMove({ gameId, token, s, value, user, lang, callbackQueryId }) {
  if (value === 'noop') return answerCallback(callbackQueryId, '⛔');
  const idx = parseInt(value, 10);
  if (isNaN(idx) || idx < 0 || idx > 8 || s.board[idx]) return answerCallback(callbackQueryId, '⛔');
  const board = s.board.slice();
  board[idx] = 'X';

  const end = async (result, reward, body) => {
    await db.clearSession(token);
    await finish(s, user, 'tictactoe', result, reward, body, callbackQueryId);
  };

  if (tttWin(board) === 'X') return end('win', BIG_WIN_REWARD, tttText(board) + '\n\n' + t(lang, 'ttt_win', { reward: BIG_WIN_REWARD, currency: CURRENCY }));
  if (tttFull(board)) return end('draw', 0, tttText(board) + '\n\n' + t(lang, 'ttt_draw'));

  board[tttBotMove(board)] = 'O';
  if (tttWin(board) === 'O') return end('lose', 0, tttText(board) + '\n\n' + t(lang, 'ttt_lose'));
  if (tttFull(board)) return end('draw', 0, tttText(board) + '\n\n' + t(lang, 'ttt_draw'));

  await db.setSession(token, user.tgId, `ibp:${gameId}`, { ...s, board, token });
  await answerCallback(callbackQueryId, '🎮');
  return editInline(s.inline, tttText(board) + '\n\n' + t(lang, 'ttt_your_turn'), { reply_markup: tttKb(gameId, token, board) });
}

async function rpsMove({ gameId, token, s, value, user, lang, callbackQueryId }) {
  const bot = pick(['rock', 'paper', 'scissors']);
  let result = 'draw';
  let reward = 0;
  if (value === bot) result = 'draw';
  else if (BEATS[value] === bot) result = 'win';
  else result = 'lose';
  reward = result === 'win' ? WIN_REWARD : 0;
  const outcome =
    result === 'win' ? t(lang, 'you_won', { reward, currency: CURRENCY })
    : result === 'lose' ? t(lang, 'you_lost')
    : t(lang, 'draw');
  await db.clearSession(token);
  await finish(
    s, user, 'rps', result, reward,
    t(lang, 'rps_result', { you: t(lang, RPS_KEYS[value]), bot: t(lang, RPS_KEYS[bot]), outcome }),
    callbackQueryId,
  );
}

async function flipMove({ gameId, token, s, value, user, lang, callbackQueryId }) {
  const side = pick(['heads', 'tails']);
  const win = value === side;
  const result = win ? 'win' : 'lose';
  const reward = win ? WIN_REWARD : 0;
  const sideName = side === 'heads' ? t(lang, 'flip_heads') : t(lang, 'flip_tails');
  const outcome = win ? t(lang, 'you_won', { reward, currency: CURRENCY }) : t(lang, 'you_lost');
  await db.clearSession(token);
  await finish(
    s, user, 'flip', result, reward,
    t(lang, 'flip_result', { side: sideName, outcome }),
    callbackQueryId,
  );
}

async function highlowMove({ gameId, token, s, value, user, lang, callbackQueryId }) {
  let next = randomInt(1, 50);
  while (next === s.n) next = randomInt(1, 50);
  const win = (value === 'higher' && next > s.n) || (value === 'lower' && next < s.n);
  const result = win ? 'win' : 'lose';
  const reward = win ? WIN_REWARD : 0;
  const outcome = win ? t(lang, 'you_won', { reward, currency: CURRENCY }) : t(lang, 'you_lost');
  await db.clearSession(token);
  await finish(
    s, user, 'highlow', result, reward,
    t(lang, 'highlow_result', { next, outcome }),
    callbackQueryId,
  );
}

async function quizMove({ gameId, token, s, value, user, lang, callbackQueryId }) {
  const idx = parseInt(value, 10);
  const win = idx === s.correctIndex;
  const reward = win ? WIN_REWARD : 0;
  await db.clearSession(token);
  await finish(
    s, user, 'quiz', win ? 'win' : 'lose', reward,
    win ? t(lang, 'quiz_correct', { reward, currency: CURRENCY }) : t(lang, 'quiz_wrong', { answer: s.options[s.correctIndex] }),
    callbackQueryId,
  );
}

async function mathMove({ gameId, token, s, value, user, lang, callbackQueryId }) {
  const idx = parseInt(value, 10);
  const ans = s.options[idx];
  const win = ans === s.answer;
  const reward = win ? WIN_REWARD : 0;
  await db.clearSession(token);
  await finish(
    s, user, 'math', win ? 'win' : 'lose', reward,
    win ? t(lang, 'math_correct', { reward, currency: CURRENCY }) : t(lang, 'math_wrong', { answer: s.answer }),
    callbackQueryId,
  );
}

async function guessMove({ gameId, token, s, value, user, lang, callbackQueryId }) {
  const picked = s.options[parseInt(value, 10)];
  if (picked === s.secret) {
    await db.clearSession(token);
    return finish(
      s, user, 'guess', 'win', BIG_WIN_REWARD,
      t(lang, 'guess_won', { n: s.secret, reward: BIG_WIN_REWARD, currency: CURRENCY }),
      callbackQueryId,
    );
  }
  const tries = s.tries - 1;
  if (tries <= 0) {
    await db.clearSession(token);
    return finish(
      s, user, 'guess', 'lose', 0,
      t(lang, 'guess_lost', { n: s.secret }),
      callbackQueryId,
    );
  }
  const next = { ...s, tries, options: newChoices(s.secret, 4, 1, 100), token };
  await db.setSession(token, user.tgId, `ibp:${gameId}`, next);
  const p = promptRequest(gameId, next, lang, token);
  await answerCallback(callbackQueryId, '🎮');
  return editInline(s.inline, p.text, { reply_markup: p.kb });
}

async function wordMove({ gameId, token, s, value, user, lang, callbackQueryId }) {
  const picked = s.options[parseInt(value, 10)];
  const win = String(picked).toLowerCase() === String(s.answer).toLowerCase();
  const reward = win ? BIG_WIN_REWARD : 0;
  await db.clearSession(token);
  await finish(
    s, user, 'word', win ? 'win' : 'lose', reward,
    win ? t(lang, 'word_correct', { reward, currency: CURRENCY }) : t(lang, 'word_wrong', { answer: s.answer }),
    callbackQueryId,
  );
}