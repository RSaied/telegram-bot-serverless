import dice from './dice.js';
import slots from './slots.js';
import guess from './guess.js';
import quiz from './quiz.js';
import rps from './rps.js';
import tictactoe from './tictactoe.js';
import math from './math.js';
import flip from './flip.js';
import highlow from './highlow.js';
import word from './word.js';

// Registration order is the order shown in the games menu.
export const GAMES = [dice, slots, guess, quiz, rps, tictactoe, math, flip, highlow, word];

export function gameById(id) {
  return GAMES.find((g) => g.id === id) || null;
}

export function gameDefs() {
  return GAMES.map((g) => ({ id: g.id, emoji: g.emoji, nameKey: g.nameKey }));
}
