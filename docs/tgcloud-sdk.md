# tgcloud SDK reference

The runtime gives a module exactly two things: **`sdk`** (and its submodules) and **your own modules**.

## Imports

```js
import { db, api, fetch, InputFile, BotApiError, EndpointError } from 'sdk';
import { table, integer, text, boolean, json, index, sql, eq, and, desc, asc, count } from 'sdk/db';
import { api } from 'sdk/api';
import { fetch } from 'sdk/fetch';

import { users } from '../schema.js';        // own modules: relative + .js
import { addItem } from '../lib/cart.js';
```

Rules: own imports are relative and end in `.js`; only `sdk` and own `tgcloud/` modules resolve.
No npm packages, no filesystem, no `Buffer` (use `Uint8Array`), no Node globals beyond `console`.

## Database — schema.js

```js
import { table, integer, text, boolean, json, index, unique, sql } from 'sdk/db';

export const users = table('users', {
  id:    integer('id').primaryKey({ autoIncrement: true }),
  tgId:  integer('tg_id').unique().notNull(),
  name:  text('name'),
  coins: integer('coins').default(0),
  lang:  text('lang').default('ar'),
  prefs: json('prefs'),
  admin: boolean('is_admin').default(false),
  created: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  idx: index('idx_users_created').on(t.created),
}));
```

- Column types: `text`, `integer`, `real`/`float`, `numeric`, `blob`, `boolean`, `json`.
- `mode`: `boolean` (0/1), `json` (TEXT), `timestamp` (unix s → Date), `timestamp_ms`, `bytes`.
- Modifiers: `.primaryKey()`, `.notNull()`, `.unique()`, `.default()`, `.generatedAlwaysAs()`, `.deprecated()`.
- **No foreign keys.** `.references()` and `foreignKey()` throw. Use plain columns and enforce integrity in code.
- Apply changes with `tgcloud migrate` (never by `push`).

## Query builder

Every query is async — always `await`.

```js
await db.select().from(users).all();
await db.select().from(users).where(eq(users.id, 1)).get();
await db.select().from(users).orderBy(desc(users.coins)).limit(10).offset(0).all();
await db.$count(users, eq(users.isBan, false));

await db.insert(users).values({ tgId: 1, name: 'A' }).run();
await db.insert(users).values([{...}, {...}]).run();
await db.insert(users).values({...})
  .onConflictDoUpdate({ target: users.tgId, set: { name: 'A' } })
  .returning().run();

await db.update(users).set({ coins: sql`${users.coins} + ${10}` }).where(eq(users.tgId, 1)).run();
await db.delete(users).where(eq(users.id, 1)).run();
```

Operators from `sdk/db`: `eq, ne, gt, gte, lt, lte, like, notLike, isNull, isNotNull, and, or, not,
between, notBetween, inArray, notInArray, count, sum, avg, min, max, asc, desc`.

Raw SQL: `db.run(sql, params)` (write), `db.all(sql)`, `db.get(sql)`, `db.values(sql)`.
Raw rows skip mode conversion.

## Bot API — `api`

```js
const me = await api.getMe();                       // result is unwrapped (no { ok, result })
await api.sendMessage({ chat_id, text, parse_mode: 'Markdown', reply_markup });
await api.editMessageText({ chat_id, message_id, text });
await api.answerCallbackQuery({ callback_query_id, text });

const bytes = await api.getFileContent(file_id);    // Uint8Array
const doc = new InputFile(bytes, 'a.pdf', { type: 'application/pdf' });
await api.sendDocument({ chat_id, document: doc });
```

Failures throw `BotApiError` with `.code`, `.description`, `.method`, `.parameters`.

## HTTP — `fetch`

```js
const res = await fetch('https://api.example.com/x', { method: 'POST', body: fetch.body.json({ a: 1 }) });
await res.json(); await res.text();
for await (const chunk of res.body) { /* Uint8Array */ }
```

Bodies: `fetch.body.json/form/text`, `Uint8Array`, `InputFile`, `FormData`. Response cap: 30 MB.

## Handlers & endpoints

- `handlers/<update_type>.js` — `export default async function (payload, ctx) {}`. Payload is the unwrapped update object; `ctx.update` is the raw update.
- `endpoints/<name>.js` — `export default async function (input, ctx) {}`; `ctx.initData.user` is verified. Throw `new EndpointError(desc, params)` to refuse.

## CLI

`init, add, login, status, diff, push, migrate, run, fetch, pull, reset, webhook, completion, upgrade`.
Deploy: `tgcloud push` (code, + static) then `tgcloud migrate` (schema). Test locally: `tgcloud run handlers/message '{ ... }'`.
