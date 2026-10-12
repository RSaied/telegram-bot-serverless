import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { users } from '../schema.js';

const LANGS = ['ar', 'en'];

// Persist the Mini App language for the current user (same values as the bot).
export default async function (input, ctx) {
  const tgId = ctx.initData.user.id;
  const lang = LANGS.includes(input.lang) ? input.lang : 'ar';

  const user = await db.select().from(users).where(eq(users.tgId, tgId)).get();
  if (!user) throw new EndpointError('Profile not found', { code: 'NOT_FOUND' });

  await db.update(users).set({ lang }).where(eq(users.tgId, tgId)).run();
  return { ok: true, lang };
}
