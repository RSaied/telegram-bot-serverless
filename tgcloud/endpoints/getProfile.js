import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { users } from '../schema.js';
import { isMaintenance } from '../lib/settings.js';

export default async function (input, ctx) {
  const tgId = ctx.initData.user.id;
  const user = await db.select().from(users).where(eq(users.tgId, tgId)).get();
  if (!user) throw new EndpointError('Profile not found', { code: 'NOT_FOUND' });

  return {
    tgId: user.tgId,
    name: user.name,
    username: user.username,
    lang: user.lang,
    coins: user.coins,
    gems: user.gems,
    xp: user.xp,
    level: user.level,
    plays: user.plays,
    wins: user.wins,
    losses: user.losses,
    streak: user.streak,
    bestStreak: user.bestStreak,
    premium: user.isPremium,
    maintenance: await isMaintenance(),
  };
}
