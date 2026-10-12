import { assertDev, updateRow } from '../lib/devstore.js';

// Storage: edit the non-key fields of one row.
export default async function (input, ctx) {
  assertDev(ctx);
  const { table, pkValue, values } = input || {};
  return await updateRow(table, pkValue, values);
}
