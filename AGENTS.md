# AGENTS.md — orientation for AI coding assistants

This is a **Telegram Serverless** project. Read this before editing anything.

## The layout

```
tgcloud/            <- EVERYTHING the platform runs. Only .js files here are deployed.
  schema.js         <- database tables (single file, named exports)
  handlers/         <- one file per Telegram update type, FLAT (no subdirs)
  endpoints/        <- functions the Mini App calls, FLAT (no subdirs)
  lib/              <- shared code, subdirectories allowed
webapp/             <- Mini App front-end (plain HTML), served as static files
tgcloud.jsonc       <- project config (static hosting)
```

## Hard rules

1. **Imports of your own files use a relative path ending in `.js`**: `from '../schema.js'`, `from '../lib/cart.js'`. No extensionless relative imports.
2. **Only `sdk` and your own `tgcloud/` modules resolve at runtime.** No npm packages, no filesystem, no network except `fetch` from `sdk`.
3. **There are NO foreign keys.** The runtime has `PRAGMA foreign_keys` off. Never call `.references()` or `foreignKey()` — they throw. Model relations with plain integer columns and enforce integrity in code.
4. **Every `db` call is async.** Always `await` it.
5. **One handler per update type.** `handlers/message.js` gets the `Message`, `handlers/callback_query.js` gets the `CallbackQuery`, etc. A handler's `export default` is what the platform calls. An update type is only handled if its file exists and is non-empty.
6. **Deploying is two steps:** `tgcloud push` (code) and `tgcloud migrate` (schema). Pushing never touches the database.
7. **No Node globals** beyond `console`. No `Buffer` — use `Uint8Array`. `FormData`, `fetch`, `InputFile` come from `sdk`.

## Conventions used in this project

- Project identifiers (developer id, app id, Mini App URLs) live in `lib/ids.js` — that is the single place to look at / edit them.
- All user-facing text goes through `lib/i18n.js` (`t(lang, key, vars)`).
- All send/edit helpers live in `lib/ui.js`; keyboards in `lib/keyboards.js`.
- Games live in `lib/games/` and are registered in `lib/games/index.js`.
