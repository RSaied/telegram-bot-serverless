import { db } from 'sdk';
import { sql } from 'sdk/db';
import { users, games } from '../schema.js';

export default async function () {
  const totalUsers = await db.$count(users);
  const totalGames = await db.$count(games);
  const row = await db.get(sql`SELECT COALESCE(SUM(coins),0) AS coins FROM users`);
  return {
    users: totalUsers,
    games: totalGames,
    coins: row?.coins ?? 0,
  };
}
