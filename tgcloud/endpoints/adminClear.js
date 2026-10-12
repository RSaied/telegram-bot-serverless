import { assertDev, clearTable } from '../lib/devstore.js';

// Storage: remove every row from a table.
export default async function (input, ctx) {
  assertDev(ctx);
  const { table } = input || {};
  return await clearTable(table);
}
