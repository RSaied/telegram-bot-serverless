# 🤖 Telegram Bot Serverless

**بوت تيليجرام متكامل يعمل بالكامل على Telegram Serverless — مفتوح المصدر.**
**A full-featured Telegram bot running entirely on Telegram Serverless — open source.**

| | |
|---|---|
| 🤖 تجربة البوت / Try the bot | https://t.me/Serverless_BetaBot |
| 📣 قناة تيليجرام / Telegram channel | https://t.me/Botate |
| 🌐 الموقع / Website | https://ssss.sy |
| 📦 الكود المصدري / Source code | https://github.com/RSaied/telegram-bot-serverless |

> هذا المشروع **مفتوح المصدر** — يمكنك نسخه وتعديله واستخدامه بحرّية.
> This project is **open source** — fork it, modify it and use it freely.

---

## 🇸🇦 العربية

### المزايا
- 👤 حسابات وملفات شخصية مع مستويات وخبرة.
- 🪙 اقتصاد داخلي: عملات، جواهر، متجر، ومكافأة يومية بسلسلة.
- 🎮 **10 ألعاب**: تحدي الأرقام، التخمين، الاختبار، حجر ورقة مقص، مطابقة الفواكه، إكس-أو، الرياضيات، رمي العملة، أعلى/أدنى، ترتيب الكلمات.
- 🕹️ لعب **1v1** بين المستخدمين داخل الدردشة ولعب ضد البوت.
- 🏆 لوحة المتصدرين، 🏅 الإنجازات، 👥 نظام الإحالات.
- 🛡️ لوحة مطوّر (إحصائيات، بث وسائط، حظر، منح، صيانة، سجل…).
- 🎡 تطبيق مصغّر (Mini App) بواجهة ويب.

### المتطلبات
- **Node.js 18+**
- بوت في تيليجرام مع تفعيل **Serverless** من [@BotFather](https://t.me/BotFather).
- أداة [`@tgcloud/cli`](https://www.npmjs.com/package/@tgcloud/cli).

### طريقة التشغيل
```bash
# 1) تثبيت الاعتماديات
npm install

# 2) ربط المشروع ببوتك (BotFather ← البوت ← Serverless ← CLI Access)
npx tgcloud login

# 3) رفع الكود + التطبيق المصغّر
npx tgcloud push

# 4) إنشاء جداول قاعدة البيانات
npx tgcloud migrate
```
ثم افتح البوت في تيليجرام وأرسل `/start`.

### اختبار أمر بدون رفع
```bash
npx tgcloud run handlers/message "{ chat: { id: 1, type: 'private' }, from: { id: 112621302, first_name: 'Dev' }, text: '/start' }"
```

### الإعدادات
كل معرّفات المشروع (معرّف المطوّر، معرّف التطبيق، روابط البوت والمستودع) موجودة في ملف واحد:
`tgcloud/lib/ids.js`.

### البنية
```
tgcloud/
  schema.js            # جداول قاعدة البيانات
  handlers/            # message, callback_query, inline_query, chat_member
  endpoints/           # واجهة التطبيق المصغّر
  lib/                 # config, ids, i18n, ui, keyboards, games/, admin, ...
webapp/                # التطبيق المصغّر (HTML ثابت)
```

### الرخصة
MIT — انظر [LICENSE](LICENSE).

---

## 🇬🇧 English

### Features
- 👤 Accounts & profiles with levels and XP.
- 🪙 In-bot economy: coins, gems, a shop and a daily bonus with streaks.
- 🎮 **10 games**: dice, guess, quiz, rock-paper-scissors, slots, tic-tac-toe, math, coin flip, high/low, word scramble.
- 🕹️ In-chat **1v1** play against other users, plus play-vs-bot.
- 🏆 Leaderboard, 🏅 achievements, 👥 referrals.
- 🛡️ Developer panel (stats, media broadcast, ban, give, maintenance, log…).
- 🎡 A Mini App (web front-end).

### Requirements
- **Node.js 18+**
- A Telegram bot with **Serverless** enabled via [@BotFather](https://t.me/BotFather).
- The [`@tgcloud/cli`](https://www.npmjs.com/package/@tgcloud/cli) tool.

### Getting started
```bash
# 1) Install dependencies
npm install

# 2) Link the project to your bot (BotFather → your bot → Serverless → CLI Access)
npx tgcloud login

# 3) Upload code + Mini App
npx tgcloud push

# 4) Create the database tables
npx tgcloud migrate
```
Then open the bot on Telegram and send `/start`.

### Test a handler without deploying
```bash
npx tgcloud run handlers/message "{ chat: { id: 1, type: 'private' }, from: { id: 112621302, first_name: 'Dev' }, text: '/start' }"
```

### Configuration
Every project identifier (developer id, app id, bot & repository URLs) lives in a single file:
`tgcloud/lib/ids.js`.

### Layout
```
tgcloud/
  schema.js            # database tables
  handlers/            # message, callback_query, inline_query, chat_member
  endpoints/           # Mini App API
  lib/                 # config, ids, i18n, ui, keyboards, games/, admin, ...
webapp/                # Mini App (static HTML)
```

### License
MIT — see [LICENSE](LICENSE).
