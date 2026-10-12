import { DEVELOPER_ID } from '../lib/config.js';

// The Mini App calls this to decide whether to show the storage tools.
// Never throws for non-devs — it simply reports `false`.
export default async function (input, ctx) {
  const id = ctx.initData.user && ctx.initData.user.id;
  return { dev: id === DEVELOPER_ID };
}
