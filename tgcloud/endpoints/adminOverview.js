import { assertDev, overview } from '../lib/devstore.js';

// Storage: row counts for every table.
export default async function (input, ctx) {
  assertDev(ctx);
  return { tables: await overview() };
}
