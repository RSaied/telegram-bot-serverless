import { db } from 'sdk';
import { desc } from 'sdk/db';
import { users } from '../schema.js';

export default async function () {
  const rows = await db.select().from(users).orderBy(desc(users.coins)).limit(10).all();
  return rows.map((u, i) => ({
    rank: i + 1,
    name: u.name || u.username || String(u.tgId),
    coins: u.coins,
    level: u.level,
  }));
}
