import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { users } from '../schema.js';
import { WIN_REWARD, WRONG_LOSS_RATIO, DEVELOPER_ID } from '../lib/config.js';
import { addCoins, recordGame } from '../lib/db.js';
import { isMaintenance } from '../lib/settings.js';

const OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '×': (a, b) => a * b,
};

// A Mini App skill challenge: the player solves an arithmetic question.
// Counts as a real game round (same stats as the in-bot games). A correct answer
// pays a fixed reward; a wrong answer deducts a share of that reward from the
// balance. No luck, no betting.
export default async function (input, ctx) {
  const tgId = ctx.initData.user.id;

  // Maintenance gate — the developer may still play while testing.
  if (tgId !== DEVELOPER_ID && (await isMaintenance())) {
    return { maintenance: true };
  }

  const user = await db.select().from(users).where(eq(users.tgId, tgId)).get();
  if (!user) throw new EndpointError('Profile not found', { code: 'NOT_FOUND' });

  const a = Number(input.a);
  const b = Number(input.b);
  const answer = Number(input.answer);
  const fn = OPS[String(input.op)];
  if (!fn || !Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(answer)) {
    throw new EndpointError('Invalid input', { code: 'BAD_INPUT' });
  }

  const correct = fn(a, b) === answer;
  const reward = correct ? WIN_REWARD : 0;
  // Wrong answer: lose WRONG_LOSS_RATIO of the win reward, never below zero.
  const penalty = Math.round(WIN_REWARD * WRONG_LOSS_RATIO);
  const loss = correct ? 0 : Math.min(penalty, Math.max(user.coins, 0));

  if (correct) await addCoins(tgId, reward);
  else if (loss > 0) await addCoins(tgId, -loss);

  await recordGame(tgId, 'math', correct ? 'win' : 'lose', reward);

  const fresh = await db.select().from(users).where(eq(users.tgId, tgId)).get();
  return { correct, reward, loss, coins: fresh.coins };
}
