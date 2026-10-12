import { assertDev, deleteRow } from '../lib/devstore.js';

// Storage: delete one row by primary key.
export default async function (input, ctx) {
  assertDev(ctx);
  const { table, pkValue } = input || {};
  return await deleteRow(table, pkValue);
}
