import { assertDev, getRows } from '../lib/devstore.js';

// Storage: a page of rows from one table.
export default async function (input, ctx) {
  assertDev(ctx);
  const { table, limit, offset } = input || {};
  return await getRows(table, limit, offset);
}
