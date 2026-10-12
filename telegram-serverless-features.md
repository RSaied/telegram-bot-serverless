# Telegram Serverless — جميع الميزات

> المصدر: https://core.telegram.org/bots/serverless

Telegram Serverless يتيح تشغيل كود الـ backend لبوتك و Mini App **مباشرة على بنية Telegram التحتية** — بدون خوادم، بدون حاويات، وبدون التفكير في التوسّع (scaling). تكتب وحدات JavaScript عادية، تنشرها بأمر واحد، ويشغّلها Telegram داخل بيئة V8 معزولة وسريعة بجوار Bot API وقاعدة بيانات مدمجة.

---

## 1. لماذا Serverless (Why serverless)

- **No infrastructure** — لا يوجد جهاز للإيجار أو التحديث أو المراقبة. الكود يعمل عند الطلب ويتوسّع تلقائيًا مع البوت.
- **Batteries included** — Telegram Bot API + قاعدة بيانات SQLite + HTTP خارجي متاحة لكل وحدة من الصندوق، بدون تثبيت أو ضبط بيانات اعتماد.
- **Fast, isolated execution** — كل استدعاء يعمل داخل V8 isolate خفيف قريب من أنظمة Telegram، فتصبح نداءات Bot API وقاعدة البيانات سريعة وموثوقة.
- **A real developer workflow** — المشروع مجلد على جهازك تحت إدارة النسخ (version control). تعدّل الملفات، ترى ما تغيّر، تنشر بشكل atomic، وتُحدّث مخطط قاعدة البيانات بـ migrations مراجَعة.

### النموذج الذهني (Mental model)

العمل في **ثلاثة أماكن** تتطابق مع بعضها:

| المكان | ما يحويه |
|---|---|
| مجلد مشروعك (Your project folder) | وحدات JavaScript — schema، كود مشترك، معالجات التحديثات، endpoints للـ Mini App، وواجهة Mini App إن وُجدت |
| السحابة (The cloud) | النسخة المنشورة من الوحدات، قاعدة بيانات بوتك، وملفات Mini App |
| الـ `tgcloud` CLI | الجسر — يظهر الفروقات ويزامنها |

لا SSH إطلاقًا. تعدّل محليًا، تشغّل `npx tgcloud push`، والمنصة تتولّى الباقي. حركة البوت تُعالج عبر الوحدات المنشورة، وقاعدة البيانات تبقى بين الاستدعاءات.

بنية المشروع تحوي **أربعة أنواع من الكود** داخل مجلد `tgcloud/` واحد:

```
tgcloud/
├─ endpoints/  # دوال يستدعيها Mini App
├─ handlers/   # دوال تتفاعل مع أنواع تحديثات Telegram
├─ lib/        # كود مشترك تستورده من أي مكان
└─ schema.js   # جداول قاعدة البيانات
```

عند وصول تحديث (رسالة، ضغط زر، inline query)، يوجّهه Telegram إلى المعالج المطابق (`handlers/message.js`, `handlers/callback_query.js`, …) ويستدعي `default export` الخاص به. تحديث بلا معالج مطابق يُتجاهل ببساطة.

Mini App اختياري: إن وُجد، تعيش واجهته في نفس المشروع بجوار `tgcloud/`. يستضيف Serverless مخروجه (build output) ويشغّل `endpoints/` التي يستدعيها.

### العرض السريع (Quick demo)

بوت كامل يردّ على كل رسالة ويتذكّر عدد الرسائل لكل محادثة.

`tgcloud/schema.js`

```js
import { table, integer } from 'sdk/db';

export const counters = table('counters', {
  chatId: integer('chat_id').primaryKey(),
  seen:   integer('seen').notNull().default(0),
});
```

`tgcloud/handlers/message.js`

```js
import { api, db } from 'sdk';
import { sql } from 'sdk/db';
import { counters } from '../schema.js';

export default async function (message) {
  const chatId = message.chat.id;

  const [row] = await db.insert(counters)
    .values({ chatId, seen: 1 })
    .onConflictDoUpdate({
      target: counters.chatId,
      set: { seen: sql`${counters.seen} + 1` },
    })
    .returning()
    .run();

  await api.sendMessage({
    chat_id: chatId,
    text: `Hello! I've seen ${row.seen} message(s) from you.`,
  });
}
```

النشر:

```
npx tgcloud push       # upload the modules
npx tgcloud migrate    # create the `counters` table
```

### حالات الاستخدام المثالية (Ideal for)

- **Conversational AI Bots** — تحتاج تخزين حالة لكل مستخدم في قاعدة البيانات.
- **Mini App Backends** — تخزّن بيانات المستخدم وتقدّم محتوى ديناميكيًا.
- **Games and Tools** — بما فيها لوحات المتصدرين (leaderboards)، الاختبارات (quizzes) وغيرها.
- **Automations and Integrations** — تستدعي واجهات HTTP لطرف ثالث وتدفع النتائج إلى المحادثات.

---

## 2. التغييرات الحديثة (Recent changes)

### October 6, 2026
- إضافة **Mini App hosting**: مخروج الواجهة الأمامية يُنشر مع البوت ويُقدَّم على `https://app<app_id>.tgcloud.ai/`.
- إضافة **endpoints**: الدوال التي يستدعيها Mini App عبر `Telegram.WebApp.Serverless.call`.
- تحديث الـ CLI إلى الإصدار **0.2.0**.
- إضافة ملف إعدادات المشروع **`tgcloud.jsonc`**.
- أصبح بالإمكان استيراد وحدات المشروع عبر **المسار النسبي (relative path)** مع لاحقة `.js`.
- كل الوحدات أصبحت داخل مجلد **`tgcloud/`**. شغّل `npx tgcloud upgrade` مرة واحدة للمشاريع القديمة.

---

## 3. البداية (Getting started)

المتطلبات: [Node.js](https://nodejs.org) 18 أو أحدث + بوت مسجّل لدى [@BotFather](https://t.me/BotFather).

> **قبل أي شيء، فعّل Serverless.** في @BotFather → افتح بوتك → **Serverless** وشغّله. هذا يفعّل الميزة للبوت ويفتح وصول CLI token والمعالجات والمكتبة وقاعدة البيانات.

### 1. إنشاء مشروع

```
npm create @tgcloud/bot example_bot
cd example_bot
```

الوسيط هو المجلد الهدف: مرّر `.` للبناء في المجلد الحالي. يعمل في مجلد موجود ولا يستبدل ملفاتك.

البنية الناتجة:

```
example_bot/
├─ tgcloud/             # كل ما تشغّله المنصة
│  ├─ handlers/
│  │  └─ message.js     # معالج رسائل مبدئي (يردّ النص)
│  ├─ lib/              # وحداتك المشتركة
│  └─ schema.js         # جداول قاعدة البيانات
├─ docs/
│  └─ tgcloud-sdk.md    # مرجع SDK (لك ولأدوات الذكاء الاصطناعي)
├─ AGENTS.md            # إرشاد لمساعدي البرمجة بالذكاء الاصطناعي
├─ package.json
└─ tgcloud.jsonc        # إعدادات المشروع
```

- الـ CLI يُثبَّت كـ dev-dependency محلي، فتشغّله بـ `npx tgcloud <command>` أو عبر اختصارات `npm run` (`npm run deploy`, `npm run status`).
- يمكن التثبيت عامًا: `npm install -g @tgcloud/cli`.

> **تبني Mini App؟** ابدأ من الواجهة الأمامية: أنشئها بأداتك المعتادة، ثم شغّل project creator في ذلك المجلد.

### 2. ربط البوت (Link your bot)

```
npx tgcloud login
```

يطلب CLI access token (من BotFather → بوتك → Serverless → CLI Access → Access token — وهو توكن منفصل عن [API token](https://core.telegram.org/bots/api#authorizing-your-bot)) ويخزّنه محليًا. صيغته `app<id>:<secret>`. يُخزَّن في `.tgcloud/` (متجاهَل في git) ولا تُطبع أبدًا الجزئية السرية. في CI استخدم متغير `TGCLOUD_TOKEN`.

### 3. استعراض الحالة

```
npx tgcloud status     # ما تغيّر محليًا مقابل النسخة المنشورة
npx tgcloud diff       # الفروقات سطرًا بسطر
```

### 4. النشر (Deploy)

```
npx tgcloud push
```

يرفع كل وحدة متغيّرة في دفعة atomic واحدة. > **النشر لا يلمس قاعدة بياناتك أبدًا.** دفع الكود وتغيير المخطط خطوتان منفصلتان عمدًا.

### 5. إضافة جدول قاعدة بيانات

```js
import { table, integer, text, sql } from 'sdk/db';

export const messages = table('messages', {
  id:      integer('id').primaryKey({ autoIncrement: true }),
  chatId:  integer('chat_id').notNull(),
  text:    text('text'),
  created: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
```

```
npx tgcloud push       # uploads the new schema
npx tgcloud migrate    # creates the `messages` table
```

`push` يبلّغ أن المخطط غير متزامن ويعرض التغيير المعلّق دون تطبيقه، ثم `migrate` ينشئ الجدول بعد تأكيدك.

### 6. تخزين وقراءة البيانات

```js
import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { messages } from '../schema.js';

export default async function (message) {
  await db.insert(messages)
    .values({ chatId: message.chat.id, text: message.text })
    .run();

  const count = await db.$count(messages, eq(messages.chatId, message.chat.id));

  await api.sendMessage({
    chat_id: message.chat.id,
    text: `Saved. That's ${count} message(s) from this chat so far.`,
  });
}
```

### 7. الاختبار بدون نشر

```
npx tgcloud run handlers/message '{ chat: { id: 1 }, text: "hello" }'
```

يشغّل معالجًا على المنصة باستخدام **ملفاتك المحلية** دون نشرها. الوسيط هو payload بصيغة [JSON5](https://json5.org). يطبع ما سُجِّل بـ `console.*`، القيمة المُرجَعة، والزمن المستغرق.

### 8. البقاء متزامنًا

- `npx tgcloud status` — ما تغيّر
- `npx tgcloud push` — ينشر
- `npx tgcloud pull` — يطابق المحلي مع السحابة
- `npx tgcloud fetch` — يفحص المنشور دون لمس ملفاتك
- `npx tgcloud reset` — يتخلّى عن التغييرات المحلية

> إذا نشر شخصان نفس البوت، تكتشف المنصة التعارض ويوقف `push` ليجعلك تسحب (pull) أولًا — لا يمكن الكتابة فوق عمل شخص آخر بصمت.

---

## 4. البناء بالذكاء الاصطناعي (Building with AI)

كل مشروع جديد يُبنى مع `AGENTS.md` و `docs/tgcloud-sdk.md` يقرأهما أدوات البرمجة الوكيلة تلقائيًا.

```
npm create @tgcloud/bot my-bot
cd my-bot
opencode            # أو Claude Code، Cursor، … أي agent يقرأ AGENTS.md
```

ثم اطلب بلغة طبيعية: "اكتب بوتًا يتذكّر قائمة مهام كل شخص — أضف عنصرًا عند إرسال نص، واعرض القائمة كاملة عند `/list`".

المساعد يعدّل `schema.js` و handlers، تراجع، تختبر بـ `npx tgcloud run`، ثم تنشر بـ `push` و `migrate`. `AGENTS.md` جزء من مشروعك — عدّله مع نمو البوت.

---

## 5. أثناء التنقّل مع BotFather (On the go)

كل المشروع متاح داخل [@BotFather](https://t.me/BotFather): افتح بوتك → **Serverless** وستجد كل ما يديره CLI على شاشة لمس:

- **Handlers** — إنشاء، تعديل، وتجربة معالجات التحديثات؛ يحافظ BotFather على تزامن الـ webhook (نفس *In sync* / *Out of sync* الذي يبلّغه CLI).
- **Endpoints** — الدوال التي يستدعيها Mini App.
- **Library** — وحدات `lib/` المشتركة.
- **Database** — تعديل `schema.js` بنفس صيغة Drizzle، مراجعة التغييرات المعلّقة وتطبيقها؛ **Save** ينشر.
- **Mini App Files** — الواجهة التي يفتحها المستخدمون في Telegram.
- **CLI Access** — احصل على CLI access token هنا.

> نفس المشروع السحابي، فيمكنك بدء معالج على هاتفك و `npx tgcloud pull` على حاسوبك لاحقًا. تشغيل معالج يعرض مخرجاته في **Console** مباشرة في المحادثة.

---

## 6. المشاريع والوحدات (Projects & modules)

مشروع serverless مجلد عادي تحت إدارة النسخ. كل ما تشغّله المنصة في مجلد `tgcloud/`. لا خطوة build للبوت، ولا `node_modules` وقت التشغيل، ولا نقطة دخول خادم.

### تشريح المشروع

```
example_bot/
├─ tgcloud/             # الجزء المنشور — لا شيء غيره
│  ├─ handlers/         # معالجات التحديثات — مسطّح، مستوى واحد فقط
│  │  ├─ message.js
│  │  └─ callback_query.js
│  ├─ endpoints/        # دوال يستدعيها Mini App — مسطّح، مستوى واحد فقط
│  │  └─ getProfile.js
│  ├─ lib/              # وحدات مشتركة؛ المجلدات الفرعية مسموحة
│  │  ├─ reply.js
│  │  └─ internal/util.js
│  └─ schema.js         # مخطط قاعدة البيانات — ملف واحد
└─ .tgcloud/            # حالة CLI، متجاهَل في git
```

فقط ملفات `.js` داخل `tgcloud/` (schema.js، lib/، handlers/، endpoints/) **تُنشر**. الباقي يبقى على جهازك. أسماء الوحدات نسبية إلى `tgcloud/`: الملف `tgcloud/handlers/message.js` هو الوحدة `handlers/message`.

- **`schema.js`** — قاعدة بياناتك: يعرّف الجداول كـ named exports بصيغة الـ schema DSL، ملف واحد، ويُنشر كأي وحدة لكن النشر لا يغيّر قاعدة البيانات (`migrate` منفصل).
- **`lib/`** — الكود المشترك القابل لإعادة الاستخدام. المجلد الوحيد المسموح باحتواء **مجلدات فرعية** (`lib/internal/util.js`, `lib/payments/stripe.js`). لا تُستدعى مباشرة من المنصة، بل تُستورد من handlers وبعضها.
- **`handlers/`** — نقاط دخول البوت. كل ملف يقابل نوع تحديث Telegram واحدًا:

| File | Handles |
|---|---|
| `handlers/message.js` | الرسائل الواردة الجديدة |
| `handlers/inline_query.js` | استعلامات [inline](https://core.telegram.org/bots/api#inline-mode) |
| `handlers/callback_query.js` | callback queries الواردة |
| … | أي نوع تحديث آخر في Bot API |

`handlers/` **مسطّح** — لا مجلدات فرعية. `export default` هو الدالة التي تستدعيها المنصة. يُعالج نوع التحديث **فقط إذا كان ملف معالجه موجودًا وغير فارغ**. تحديث بلا معالج يُتجاهل.

> لإنشاء معالج جديد: `npx tgcloud add handlers/<type>`.

- **`endpoints/`** — الجانب السحابي للـ Mini App. كل ملف دالة يستدعيها Mini App بالاسم، فيجيب `endpoints/getProfile.js` على `POST /api/getProfile`. المنصة تتحقق أن النداء من مستخدم Telegram داخل Mini App قبل تشغيل كودك. `endpoints/` **مسطّح** مثل `handlers/`.
- **`.tgcloud/`** — حالة محلية يديرها CLI فقط (بما فيها بيانات الاعتماد)، متجاهَل في git، لا تقرأ/تكتب فيه يدويًا.

### نظام الوحدات (The module system)

وقت التشغيل، ترى الوحدة شيئين فقط: **SDK المنصة** و**وحدات مشروعك الأخرى**. لا npm packages، لا نظام ملفات، ولا شبكة إلا عبر `fetch` من SDK.

استورد وحداتك بالمسار النسبي مع لاحقة `.js`، والـ SDK باسمه:

```js
// tgcloud/handlers/message.js
import { users } from '../schema.js';              //  وحدة المخطط
import { addItem } from '../lib/cart.js';          //  وحدة lib
import { format } from '../lib/internal/fmt.js';   //  وحدة lib متداخلة
import { db, api, fetch } from 'sdk';              //  SDK المنصة
```

الاستيراد النسبي يجب أن ينتهي بـ `.js` ولا يخرج خارج `tgcloud/`. كل وحدة لها **اسم** — مسارها داخل `tgcloud/` بدون اللاحقة (مثل `schema`, `lib/cart`, `handlers/message`) — وهو ما يستخدمه `npx tgcloud run` والمخرجات، ويمكن الاستيراد به (`from 'lib/cart'` بدون لاحقة). يُفضَّل الاستيراد النسبي لأنه مفهوم لمحرّرك.

المتاح وقت التشغيل بالضبط: `sdk` ووحداته الفرعية (`sdk/db`, `sdk/api`, `sdk/fetch`) ووحداتك داخل `tgcloud/`.

### المعالجات (Handlers)

```js
// handlers/message.js
import { api } from 'sdk';

export default async function (message) {
  await api.sendMessage({
    chat_id: message.chat.id,
    text: `You said: ${message.text ?? '(no text)'}`,
  });
}
```

المعالج يستقبل **payload** التحديث كوسيط أول — المنصة تفكّ تغليف [Update](https://core.telegram.org/bots/api#update). `handlers/message.js` يستقبل [Message](https://core.telegram.org/bots/api#message) (أي `update.message`)؛ `handlers/callback_query.js` يستقبل [CallbackQuery](https://core.telegram.org/bots/api#callbackquery)، وهكذا. الوسيط الثاني هو كائن سياق لكل استدعاء (`ctx`) يحمل `ctx.update` الخام.

الاختبار:

```
npx tgcloud run handlers/message '{ chat: { id: 1 }, text: "hi" }'
```

لتمرير `ctx` أضف `--ctx '{ update: { update_id: 1 } }'`.

### نقاط النهاية (Endpoints)

```js
// endpoints/getProfile.js
import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { profiles } from '../schema.js';

export default async function (input, ctx) {
  const user = ctx.initData.user;
  const profile = await db.select().from(profiles).where(eq(profiles.userId, user.id)).get();
  if (!profile) throw new EndpointError('Profile not found', { userId: user.id });
  return profile;
}
```

- الوسيط الأول `input`: كائن JSON أرسله الـ Mini App.
- الوسيط الثاني `ctx` يحمل **`ctx.initData`** — [init data](https://core.telegram.org/bots/webapps#webappinitdata) الخاص بـ Mini App (`user`, `chat`, `start_param`, `auth_date`, …) **متحقّق منه مسبقًا** بواسطة المنصة. نداء بلا init data صالح يُرفض بـ `401` قبل تشغيل كودك.
- ما يُرجعه endpoint يُرسَل كـ JSON.
- لرفض نداء: `throw new EndpointError(description, parameters?)`. الـ Mini App يستلم الوصف وكائن `parameters` كما هما. أي استثناء آخر يُبلَّغ كخطأ داخلي عام، والرسالة الحقيقية تذهب لسجلاتك فقط.

**الاستدعاء من Mini App:**

```js
Telegram.WebApp.Serverless.call('getProfile', { lang: 'en' }, function (err, profile) {
  if (err) {
    if (err.type === 'ENDPOINT_ERROR') showMessage(err.message);
    return;
  }
  render(profile);
});
```

`err.type` يساوي `'ENDPOINT_ERROR'` عند رفع `EndpointError`، وأي قيمة أخرى تعني أن المنصة رفضت النداء أو فشل endpoint بشكل غير متوقع، مثل `'UNAUTHORIZED'`.

أسماء الـ endpoints كمعرّفات JavaScript — حروف وأرقام و`_`، ولا تبدأ برقم. للتجربة بدون Mini App:

```
npx tgcloud run endpoints/getProfile '{}' --ctx '{ initData: { user: { id: 1, first_name: "Ann" } } }'
```

### ما الذي يُنشر (What gets deployed)

عند `npx tgcloud push`، يجمع CLI كل ملف `.js` تحت `schema.js` و `lib/` و `handlers/` و `endpoints/` ويرسلها كفضاء وحدات مشروعك — مع مجلد build الخاص بـ Mini App إن حدّده `tgcloud.jsonc`. أي شيء موجود في السحابة وغير موجود في مشروعك يُحذف، فالنسخة المنشورة تطابق مجلدك دائمًا بما فيها الحذف. ملف `.js` داخل `tgcloud/` لكن خارج المواقع المعروفة يُعلَّم. Markdown و dotfiles و `.tgcloud/` لا تُنشر أبدًا.

### واجهة Mini App الأمامية (Mini App front-end)

المشروع يحتفظ بمخروج build الواجهة بجوار البوت. `push` واحد ينشر الكود والملفات الثابتة معًا، ويُقدَّم التطبيق على `https://app<app_id>.tgcloud.ai/` (يطبعه `push` — استخدمه كـ URL للـ Mini App في BotFather).

```
npm create vite@latest example_app   # أو create-vue، …
cd example_app
npm create @tgcloud/bot .
```

يُضبط ما يُستضاف في **`tgcloud.jsonc`**:

```jsonc
{
  "$schema": "./node_modules/@tgcloud/cli/schema/tgcloud.json",
  "static": {
    "source": "dist",
    "spa": true,
    "immutable": ["/assets/*"],
    "headers":   [{ "path": "/*", "set": { "Referrer-Policy": "no-referrer" } }],
    "redirects": [{ "from": "/old", "to": "/new", "status": 301 }]
  }
}
```

- **`"source"`** مطلوب فقط (مجلد build نسبةً لجذر المشروع).
- `init` يعيّنه تلقائيًا: Vite → `dist`؛ Next.js/Nuxt/SvelteKit/React Router/TanStack Start/Angular → لا شيء (اضبط static export أولًا).
- سطر `$schema` يمنح autocomplete وتحققًا في محرّرك. JSON مع تعليقات وفواصل زائدة. إن احتاج أداة أخرى قراءته كـ JSON صرف سمّه `tgcloud.json` (يجب أن يكون JSON صرفًا).

**خيارات التقديم:**
- **`spa`** — تقديم `index.html` للمسارات غير الموجودة بلا امتداد، ليعمل client-side router عند reload. المسارات ذات امتداد تحصل على `404`.
- **`immutable`** — أنماط للملفات ذات content hash (مثل Vite `/assets/*`) ليخزّنها المتصفح سنة. استخدمها فقط للملفات المُهشّرة.
- **`headers`** — ترويسات استجابة للمسارات المطابقة (مسار دقيق أو بادئة تنتهي بـ `/*`). قيمة `null` تحذف ترويسة.
- **`redirects`** — قواعد إعادة توجيه، أول مطابقة تفوز. الملف الموجود يتغلّب دائمًا على القاعدة. `status` = `301` افتراضيًا.
- **`"static": "dist"`** — اختصار لـ `{ "source": "dist" }`.
- **`"static": false`** — يزيل الموقع المنشور عند الدفعة التالية. حذف المفتاح يوقف إدارة المشروع للملفات الثابتة دون إزالة المنشور.

**ابنِ قبل الدفع.** `push` يرفع المجلد كما هو على القرص (يتخطى الملفات/المجلدات التي تبدأ بنقطة) ولا يشغّل build. استخدم `npm run deploy` (يشغّل build ثم push).

الموقع يُقدَّم من جذر مضيفه، فـ `base` الافتراضي (`/`) صحيح. Telegram Web يفتح Mini Apps في iframe، فلا تضف `X-Frame-Options` أو سياسة `frame-ancestors` مقيّدة. نفس المضيف يجيب على endpoints تحت `/api/` — لا تضع ملفاتك تحت `/api/`.

---

## 7. قاعدة البيانات (The database)

كل بوت يحصل على قاعدة بيانات خاصة — مخزن SQLite يبقى بين الاستدعاءات ومتاح لكل وحدة عبر `db`. تصف الجداول في `schema.js` بصيغة DSL صغيرة ومُنمّطة، وتقرأ/تكتب بـ query builder سهل، وتطوّرها بـ migrations مراجَعة.

> **تعرف [Drizzle ORM](https://orm.drizzle.team)؟** إذًا تعرف كيف تتحدّث مع قاعدة البيانات هنا. صيغة schema والـ query builder تتبع Drizzle — column builders، `select().from().where()`، العوامل، `onConflictDoUpdate`، `.returning()`، ووسم `sql`. تستوردها من `sdk/db`، مع بعض خصوصيات المنصة (أبرزها [لا مفاتيح أجنبية](#لا-مفاتيح-أجنبية)).

### تعر يف الجداول (Declaring tables)

```js
import { table, integer, text, boolean, json, index, sql } from 'sdk/db';

export const users = table('users', {
  id:      integer('id').primaryKey({ autoIncrement: true }),
  tgId:    integer('tg_id').unique(),
  name:    text('name').notNull(),
  lang:    text('lang').default('en'),
  isAdmin: boolean('is_admin').default(false),
  prefs:   json('prefs'),
  created: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  createdIdx: index('idx_users_created').on(t.created),
}));
```

`table(name, columns, extras?)`:
- **`name`** اسم الجدول في SQL.
- **`columns`** خريطة خاصية JS → تعريف العمود.
- **`extras`** callback اختياري `(t) => ({ … })` حيث `t` يعرض الأعمدة — عرّف الفهارس وقيود الجدول هنا.

#### أنواع الأعمدة (Column types)

| Factory | نوع SQLite | ملاحظات |
|---|---|---|
| `text()` | TEXT | |
| `integer()` | INTEGER | |
| `real()` | REAL | مرادف `float()` |
| `numeric()` | NUMERIC | |
| `blob()` | BLOB | يقرأ/يكتب `Uint8Array` |
| `boolean()` | INTEGER | يُخزَّن 0/1، يُقرأ `true`/`false` |
| `json()` | TEXT | JSON.stringify/parse تلقائي |

اسم العمود اختياري — احذفه ليُستخدم مفتاح JS. خيار `mode` يتحكم بالتحويل:

| `mode` | يُخزَّن كـ | قيمة JS |
|---|---|---|
| `boolean` | INTEGER 0/1 | `boolean` |
| `json` | TEXT (JSON) | أي كائن/مصفوفة |
| `timestamp` | INTEGER (ثواني unix) | `Date` |
| `timestamp_ms` | INTEGER (مللي ثانية unix) | `Date` |
| `bytes` | BLOB | `Uint8Array` |

`boolean()` و `json()` اختصارات لـ `integer(name, { mode: 'boolean' })` و `text(name, { mode: 'json' })`. `blob()` يقرأ/يكتب `Uint8Array` — لا يوجد Node `Buffer`. الـ `mode` يتحكم فقط بـ **الترميز** لا بنوع التخزين، لذا `blob('col', { mode: 'json' })` هو نظير `json()` لكن في عمود BLOB.

#### مُعدِّلات الأعمدة (Column modifiers)

```js
integer('id').primaryKey({ autoIncrement: true })
text('name').notNull()
text('tg').unique()
text('lang').default('en')
integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`)
text('slug').generatedAlwaysAs(sql`lower(name)`, { mode: 'stored' })  // أو 'virtual'
text('email').deprecated('replaced by login')   // يعلّم العمود للحذف
```

`.default()` على عمود `json()` يرمّز القيمة؛ default بصيغة `` sql`…` `` يُمرَّر حرفيًا. `.deprecated()` نهائي.

#### الفهارس والقيود (Indexes and constraints)

```js
table('t', { /* … */ }, (t) => ({
  uq:     unique('uq_email').on(t.email),
  chk:    check('chk_done', sql`${t.done} in (0, 1)`),
  idx:    index('idx_name').on(t.col),
  uidx:   uniqueIndex('uidx_email').on(t.email),
  lower:  index('idx_lower').on(sql`lower(${t.email})`),          // فهرس تعبير
  active: index('idx_active').on(t.userId).where(sql`done = 0`),  // فهرس جزئي
}));
```

مُعدِّلات على مستوى الجدول بعد `table(...)`: `.strict()`, `.withoutRowid()`, `.deprecated('reason')`.

### لا مفاتيح أجنبية (No foreign keys)

الـ runtime يعمل مع `PRAGMA foreign_keys` **مطفأ**. مفتاح أجنبي معلن سيصبح خاملًا بصمت، والأسوأ من عدمه، لذا يجعله الـ DSL مستحيلًا: `.references()` و `foreignKey()` على مستوى الجدول **يرميان خطأً عند التعريف**، ومخطط يستخدمهما لن يُنشر.

نمذج العلاقات بأعمدة عادية (`userId: integer('user_id')`) وفرض **التكامل** في كود التطبيق: أدخل الآباء قبل الأبناء، واحذف الأبناء قبل الآباء، وعالج الأخطاء واسحب الأيتام بـ `LEFT JOIN … WHERE parent.id IS NULL`.

> غياب المفاتيح الأجنبية قيد مقصود لا سهو. احسب حسابه مبكرًا عند التخطيط.

### الاستعلام (Querying)

`db` query builder سهّل. **كل استعلام غير متزامن** — الطرَفيات (`.all()`, `.get()`, `.values()`, `.run()`) تُرجع Promises، لذا استخدم `await` **دائمًا**.

```js
import { db } from 'sdk';
import { eq, and, desc, asc, count, sql } from 'sdk/db';
import { users, todos } from '../schema.js';

await db.select().from(todos).all();                          // كل الصفوف
await db.select().from(todos).where(eq(todos.id, 1)).get();   // أول صف أو null
await db.select().from(todos).values();                       // صفوف كمصفوفات قيم

await db.select().from(todos)
  .where(and(eq(todos.userId, uid), eq(todos.done, false)))
  .orderBy(desc(todos.priority), asc(todos.id))
  .limit(10).offset(20)
  .all();

// إسقاط مخصص: { alias: columnRef | sqlExpr | aggregate }
await db.select({ id: todos.id, title: todos.text, n: count() })
  .from(todos).groupBy(todos.userId).having(sql`count(*) > ${1}`).all();

// عدّ الصفوف — مساعد وليس طرَفية builder:
await db.$count(todos);                        // كل الصفوف
await db.$count(todos, eq(todos.done, false)); // مع فلترة
```

- قابلة للتسلسل: `.where()`, `.orderBy()`, `.limit()`, `.offset()`, `.groupBy()`, `.having()`, `.distinct()`.
- طرَفيات: `.all()`, `.get()`, `.values()`.
- عدّ الصفوف بـ `db.$count(table, where?)` أو `count()` في الإسقاط.

**Insert, update, delete:**

```js
await db.insert(todos).values({ userId: 1, text: 'Buy milk' }).run();
await db.insert(todos).values([{ text: 'A' }, { text: 'B' }]).run();   // دفعة
await db.insert(todos).values({ text: 'X' }).returning().run();        // RETURNING *

await db.insert(users).values({ tgId: 42, name: 'Ann' })
  .onConflictDoUpdate({ target: users.tgId, set: { name: 'Ann' } }).run();

await db.update(todos).set({ done: true }).where(eq(todos.id, 1)).run();
await db.delete(todos).where(eq(todos.id, 1)).run();
```

> إدخال الدفعة استatement واحد، محدود بحدّ متغيّرات SQLite (`rows × columns`)؛ عند تجاوزه يفشل — قسّمه بنفسك.

**العوامل (Operators)** تُستورد من `sdk/db`:

```js
import {
  eq, ne, gt, gte, lt, lte,
  like, notLike,
  isNull, isNotNull, and, or, not,
  between, notBetween, inArray, notInArray,
  count, sum, avg, min, max,
  asc, desc,
} from 'sdk/db';
```

`.where(a, b)` بعدة وسائط مثل `and(a, b)`. الوسيط الثاني للمقارنة قيمة افتراضيًا، لكن قد يكون عمودًا آخر أو `` sql`…` `` مثل `eq(a.x, b.y)`. التجميعات (`count/sum/avg/min/max`) شذرات sql لإسقاط `.select({ … })`.

**Raw SQL** — عندما لا يكفي الـ builder، انزل إلى SQL خام. الوضع يُختار بالطريقة: `db.run` للكتابة، `db.all` لصفوف كثيرة، `db.get` لصف واحد، `db.values` لصفوف كمصفوفات موضعية.

```js
await db.run('UPDATE todos SET done = 1 WHERE id = :id', { ':id': 5 });
// → { rowsAffected: 3, lastInsertRowid: 0, rows: [] }

await db.all(sql`SELECT * FROM todos WHERE done = ${false}`);
await db.get(sql`SELECT count(*) AS c FROM todos`);
await db.values(sql`SELECT id, text FROM todos`);   // → [[1, 'buy milk']]
```

الكتابة تُرجع **run result** — `rowsAffected`, `lastInsertRowid`, و `rows` (تحمل جملة `RETURNING` إن وُجدت). استخدم `db.values` عند إسقاط عمودين بنفس الاسم (join مثل `SELECT u.id, o.id`) لأن `db.all` يفهرس الصفوف باسم العمود فيطغى الثاني على الأول.

وسم `` sql`…` `` يحوّل `${value}` لمعامل مرتبط و `${table.column}` لمعرّف، ويدمج شذرات sql متداخلة. استخدم `sql.raw('…')` لقيمة حرفية بلا معاملات.

> الاستعلامات الخام **غير مرتبطة بجدول**، فصفوفها تعود بلا تحويل mode — boolean = `0`/`1`، عمود JSON = نص، timestamp = رقم. فقط builder المرتبط بجدول يحوّل القيم.

### الترحيلات (Migrations)

المنصة تفصل **نشر الكود** عن **تغيير البيانات**، وتصنّف كل تغيير مخطط حسب خطورته.

**النشر لا يلمس قاعدة البيانات أبدًا.** عند `npx tgcloud push` لمخطط `schema.js` متغيّر، تسجّل المنصة المخطط الجديد وتخبرك بما *سيُغيّره* دون تطبيق شيء:

```
npx tgcloud push       # انشر schema.js؛ يعرض تغييرات DB المعلّقة
npx tgcloud migrate    # راجعها وطبّقها
```

`npx tgcloud migrate` يحسب الفرق بين مخططك وقاعدة البيانات الحيّة ويمرّ بك خلاله. يُسأل دائمًا قبل أي تطبيق، فأي نشر روتيني لا يمكن أن يُشغّل migration بيانات بالخطأ.

حالة كل تغيير معلّق:

| الحالة | المعنى | في `migrate` |
|---|---|---|
| **safe** | إضافي وغير حاجب — جدول/عمود/فهرس جديد | تُطبَّق معًا في خطوة واحدة بعد التأكيد |
| **warning** | قد يكون مدمّرًا أو بطيئًا — حذف شيء أو فهرس على جدول ضخم | تُعرض واحدة تلو الأخرى، كل واحدة تُؤكَّد منفصلة |
| **manual** | لا يمكن تلقائيًا — مثل تغيير نوع عمود | تُعرض مع إرشاد؛ تنفّذها يدويًا |
| **undocumented** | موجود في DB لكن ليس في مخططك | تُعرض للعلم؛ لا تُطبَّق |

التغييرات الآمنة سريعة وتُراجَع معًا. كل تحذير تأكيد فردي متعمّد — لا يوجد "apply all" للتغييرات المدمّرة. `migrate` ينتهي بملخص: كم تغيير طُبِّق، تُخطّي، ينتظر إصلاحًا يدويًا، أو ليس في مخططك.

> راجع [`migrate`](#migrate-1) للأعلام (`--dry-run`, `--safe`, `--yes`, `--local`).

#### إزالة العناصر (Removing things)

حذف جدول أو عمود من `schema.js` **لا يحذفه**. للإزالة، علّمه deprecated:

```js
// حذف عمود
text('email').deprecated('replaced by login')

// حذف جدول كامل
export const oldSessions = table('old_sessions', { /* … */ }).deprecated('unused');
```

في `migrate` التالي، يظهر العنصر المُهمَل كإسقاط بحالة **warning** تؤكّده فرديًا. بعد اختفائه، احذف التعريف.

#### تغيير نوع عمود (Changing a column's type)

تغييرات النوع **manual** — لا يمكن لـ SQLite دائمًا فعلها في المكان، وإجبار القيم الموجودة قرار اجتهادي. يعرض `migrate` التغيير وسببه؛ نفّذه بنفسك بـ raw SQL (`db.run(...)`)، عادةً بإنشاء عمود/جدول جديد، نسخ البيانات، والتبديل.

---

## 8. الـ SDK

وقت التشغيل لوحدة واحدة مكتبة: `sdk`. تجمع الثلاثة التي يحتاجها backend البوت — قاعدة بيانات، Telegram Bot API، و HTTP خارجي — بلا تثبيت ولا ضبط بيانات اعتماد.

```js
import { db, api, fetch, InputFile, BotApiError, EndpointError } from 'sdk';   // السطح كامل
// أو من الوحدات الفرعية:
import { table, integer, text, eq, sql } from 'sdk/db';
import { api } from 'sdk/api';
import { fetch } from 'sdk/fetch';
```

| Import | ما هو |
|---|---|
| `db` | قاعدة البيانات — query builder وصيغة schema → [قاعدة البيانات](#7-قاعدة-البيانات-the-database) |
| `api` | Telegram Bot API — `api.sendMessage(...)` → [بالأسفل](#bot-api) |
| `fetch` | HTTP خارجي → [بالأسفل](#http) |
| `InputFile` | ملف (bytes + name) للرفع — يعمل مع `api` و `fetch` → [Files](#files) |
| `EndpointError` | رفض نداء Mini App برسالة يمكنه عرضها → [Endpoints](#نقاط-النهاية-endpoints) |

استورد وحدات مشروعك بالمسار النسبي مع `.js` (`from '../schema.js'`, `from '../lib/cart.js'`).

### Bot API

`api` يمنحك [Telegram Bot API](https://core.telegram.org/bots/api) كاملًا. استدعِ أي دالة بـ `api.<method>(params)`. كل دالة حالية — ومستقبلية — تعمل **دون تحديث SDK**.

```js
import { api } from 'sdk';

const me = await api.getMe();                            // → النتيجة مفكوكة
await api.sendMessage({ chat_id: id, text: 'Hello!' });
await api.editMessageText({ chat_id, message_id, text: 'Updated' });
await api.answerCallbackQuery({ callback_query_id, text: 'Done' });
```

- **يُفَكّ غلاف الاستجابة.** Bot API يغلّف النتائج بـ `{ ok: true, result: … }`، لكن `api` يُرجع `result` مباشرةً. المعاملات بأسماء snake_case (`chat_id`, `message_id`, `reply_markup`, …).
- **الأخطاء ترمي `BotApiError`.** عند `{ ok: false }` يُرمى الخطأ بدل إرجاع قيمة falsy. يحمل `.code` (error_code)، `.description`، `.method`، و `.parameters` (مثل `retry_after` عند 429، أو `migrate_to_chat_id`).

```js
import { api, BotApiError } from 'sdk';

try {
  await api.deleteMessage({ chat_id, message_id });
} catch (e) {
  if (e instanceof BotApiError && e.code === 400) {
    // 400 = الرسالة ذهبت بالفعل؛ لا بأس هنا.
  } else {
    throw e;
  }
}
```

#### Files

تعامل مع **bytes** الملف، لا `file_id` فقط — ارفع ملفات جديدة وحمّل الموجودة.

**الرفع — `InputFile`.** غلّف bytes خام في `InputFile` (يحمل bytes، اسم ملف، و MIME `type` اختياري) ومرّره حيث يتوقع أسلوب Bot API ملفًا:

```js
import { api, InputFile } from 'sdk';

const doc = new InputFile(bytes, 'report.pdf', { type: 'application/pdf' });
await api.sendDocument({ chat_id, document: doc });

// ملفات متداخلة داخل params تعمل أيضًا — مثل ألبوم:
await api.sendMediaGroup({ chat_id, media: [
  { type: 'photo', media: new InputFile(a, 'a.jpg', { type: 'image/jpeg' }) },
  { type: 'photo', media: new InputFile(b, 'b.jpg', { type: 'image/jpeg' }) },
]});
```

تُدفَّق bytes إلى Telegram كرفع multipart حقيقي. حدود Bot API: حتى **50 MB** لكل ملف (**10 MB** للصورة).

**التنزيل — بـ `file_id`.** مساعدان يجلبان bytes الملف. المنصة تحلّ `file_id` نيابةً عنك (تشغّل `getFile` وتجلب المحتوى خلف الكواليس)، فلا تلمس التوكن أو رابط التنزيل:

```js
const bytes = await api.getFileContent(file_id);          // → Uint8Array (الملف كاملًا)

const { file, body } = await api.getFileStream(file_id);  // دفق بدلًا من ذلك
file.file_unique_id;                                      // معلومات getFile
for await (const chunk of body) { /* Uint8Array */ }      // أو خزّنه: await stream.bytes()
```

> Bot API يحدّ تنزيلات `getFile` بـ **20 MB**، وهو السقف للمساعدين.

### HTTP

`fetch` عميل شبيه بـ `fetch` للاتصال بالعالم الخارجي — واجهات طرف ثالث، webhooks، أي شيء عبر HTTP.

```js
import { fetch } from 'sdk';

const res = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Pavel' }),
});
if (!res.ok) throw new Error(res.statusText);
const data = await res.json();
```

الاستجابة تحاكي منصة الويب: `res.status`, `res.statusText`, `res.ok` (true لـ 200–299), `res.url`, `res.headers` (`.get()`, `.has()`, `.keys()`, `.entries()`)، وقارئات `await res.json()` / `await res.text()`.

> يمكن قراءة الجسم تدريجيًا كـ **stream** — `for await (const chunk of res.body) { … }` — وهي طريقة استهلاك server-sent events أو مخرجات **واجهات AI** رمزًا برمز.

مساعدات الجسم تضبط `Content-Type` المطابق:

```js
await fetch(url, { method: 'POST', body: fetch.body.json({ a: 1 }) }); // application/json
await fetch(url, { method: 'POST', body: fetch.body.form({ a: 1 }) }); // x-www-form-urlencoded
await fetch(url, { method: 'POST', body: fetch.body.text('hi') });     // text/plain
```

أجسام الطلبات يمكن أن تحمل **ملفات و bytes خام**: مرّر `Uint8Array` أو `InputFile` أو `FormData` (لـ multipart/form-data) كـ `body`، وتُدفَّق bytes:

```js
import { fetch, FormData, InputFile } from 'sdk';

const form = new FormData();
form.append('file', new InputFile(bytes, 'photo.jpg', { type: 'image/jpeg' }));
form.append('caption', 'from my bot');
const res = await fetch('https://api.example.com/upload', { method: 'POST', body: form });
```

**قيدان:**
- تُقرأ **الاستجابة** كنص — `await res.json()` / `await res.text()`، أو دفق chunk-by-chunk بـ `res.body`.
- إجمالي الاستجابة محدود بـ **30 MB**. الدفق يسمح بمعالجة جسم كبير تدريجيًا لكنه لا يرفع الحد.

### التسجيل (Logging)

`console` قياسي متاح — لا استيراد. مخرجه يُلتقط ويُعرض بواسطة `npx tgcloud run`، فهو أداة تصحيحك الأساسية أثناء التطوير.

```js
console.log('processing', { chatId: id });   // log / debug — عادي
console.info('started');                     // info  — أزرق
console.warn('rate limited');                // warn  — أصفر
console.error(err);                          // error — أحمر، مع stack trace
```

كل سطر موسوم بـ `[file:line]` مصدره. `console.error` و `console.trace` يضيفان stack كاملًا، بينما `console.warn` لا. عند `npx tgcloud run`، تُطبع هذه السطور ببادئة ملوّنة لكل مستوى، والزمن منذ بدء التشغيل، والمصدر.

---

## 9. واجهة سطر الأوامر (CLI reference)

`tgcloud` هو الجسر بين مجلد مشروعك والسحابة. يبني المشاريع، يعرض ما تغيّر، ينشر، يشغّل الوحدات، ويطبّق migrations. يحتاج [Node.js](https://nodejs.org) 18+.

```powershell
# موصى به — أنشئ مشروعًا مع CLI مثبّتًا داخله:
npm create @tgcloud/bot example_bot

# أو ثبّت CLI عامًا وابدأ مجلدًا فارغًا:
npm install -g @tgcloud/cli
tgcloud init
```

اسم حزمة npm هو `@tgcloud/cli`، والأمر `tgcloud`. كل الأوامر تعمل من أي مجلد فرعي في مشروعك.

| الأمر | الغرض |
|---|---|
| `init` | بناء مشروع جديد في المجلد الحالي |
| `add` | بناء وحدة جديدة (handler، endpoint، أو lib) |
| `login` | ربط المشروع ببوت (يحفظ التوكن) |
| `status` | إظهار ما تغيّر محليًا مقابل السحابة |
| `diff` | إظهار الفروقات سطرًا بسطر |
| `push` | نشر الوحدات المتغيّرة ومخروج build الخاص بـ Mini App |
| `migrate` | تطبيق تغييرات المخطط على قاعدة البيانات |
| `run` | تشغيل وحدة على المنصة بدون نشر |
| `fetch` | فحص المنشور دون تغيير المحلي |
| `pull` | مطابقة الملفات المحلية مع السحابة |
| `reset` | التخلّي عن التغييرات المحلية واستعادة حالة السحابة |
| `webhook` | فحص وإعادة مزامنة webhook الذي تديره المنصة |
| `completion` | طباعة سكربت إكمال shell (bash/zsh/fish) |
| `upgrade` | نقل مشروع ما قبل 0.2.0 إلى `tgcloud/` |

### المصادقة (Authentication)

المشروع مرتبط ببوت عبر توكنه بصيغة `app<id>:<secret>`. الجزء `app<id>` عام وقد يُطبع؛ السرّ لا يظهر في السجلات أو الأخطاء.

ترتيب حلّ التوكن:
1. متغير البيئة **`TGCLOUD_TOKEN`** — لـ CI؛ لا يُكتب على القرص.
2. **`.tgcloud/credentials`** — يكتبه `npx tgcloud login`.
3. لا شيء → خطأ يوجهك لـ `npx tgcloud login`.

الـ CLI **لا يطلب التوكن في منتصف أمر أبدًا**. إن أصبح توكن محفوظ غير صالح، يحذفه ويطلب `login` مجددًا.

### `init`

```
npx tgcloud init
```

يبني مشروعًا في المجلد الحالي: مجلد `tgcloud/` مع `schema.js`، `lib/`، `handlers/` ومعالج مبدئي، إضافةً إلى `tgcloud.jsonc`، `AGENTS.md`، `docs/`، ومجلد الحالة `.tgcloud/`. شغّله في جذر مشروع واجهة موجودة أيضًا — يضيف `tgcloud/` والمستندات ولا يستبدل ملفاتك. إن تعرّف على الواجهة، يوجّه `tgcloud.jsonc` لمجلد build ويضيف سكربت `deploy` (build ثم push) في `package.json` — فقط إن لم يكن لديك سكربت `deploy`.

يرفض `init` إنشاء مشروع **داخل مشروع آخر**. إعادة تشغيله في جذر مشروع أمر طبيعي ويضيف الناقص.

### `add`

```
npx tgcloud add <target>
```

يبني وحدة جديدة واحدة جاهزة للتعديل — handler أو endpoint أو وحدة `lib/`.

```
npx tgcloud add handlers/callback_query   # معالج تحديث جديد
npx tgcloud add endpoints/getProfile      # endpoint جديد للـ Mini App
npx tgcloud add lib/cart                  # وحدة مشتركة جديدة
```

> `add` لا يستبدل ملفًا موجودًا أبدًا.

`<target>` هو مسار الوحدة (لاحقة `.js` اختيارية). في `handlers/` يجب أن يكون الاسم نوع تحديث Telegram صالحًا — المنصة تعلن المجموعة الصالحة، فيُرفض الاسم غير الصالح مقدَّمًا. `handlers/` و `endpoints/` مسطّحة، بينما قد يكون `lib/` متداخلًا (`lib/payments/stripe`). إعطاء **المجلد فقط** خطأ مفيد يسرد أنواع التحديثات التي لا تملكها.

> إكمال `<Tab>` يعرض نفس المجموعة — راجع `completion`.

الملف المولّد يحوي `export default` حيًّا، فالمعالج نشط بمجرد النشر. انشر بـ `push`.

### `login`

```
npx tgcloud login
```

يطلب CLI access token (من BotFather → بوتك → Serverless → CLI Access → Access token، وهو منفصل عن [API token](https://core.telegram.org/bots/api#authorizing-your-bot))، يتحقق منه، ويحفظه في `.tgcloud/credentials`.

> `login` هو الأمر **الوحيد** الذي يطلب التوكن، ويحتاج طرفية تفاعلية. في CI اضبط `TGCLOUD_TOKEN`.

### `status`

```
npx tgcloud status
```

يعرض لكل ملف ما تغيّر بين مجلد عملك والنسخة المنشورة: معدّل، جديد، محذوف، دون تغيير. يعمل offline مقابل حالة السحابة من آخر `push`/`pull`/`fetch`. يحذّر أيضًا من ملفات `.js` داخل `tgcloud/` لن تُنشر. لمشروع فيه Mini App، يعرض تغييرات مجلد build منذ آخر نشر.

### `diff`

```
npx tgcloud diff
```

مثل `status` لكن يعرض الفروقات الفعلية سطرًا بسطر للوحدات المتغيّرة. offline أيضًا.

### `push`

```
npx tgcloud push [files...]
```

ينشر مشروعك إلى السحابة في دفعة atomic واحدة.

- **بلا وسائط**: ينشر المشروع كاملًا، والنسخة المنشورة تطابق مجلدك تمامًا — الوحدات المحذوفة محليًا تُزال في السحابة.
- **بوسائط ملف/مجلد** (`npx tgcloud push tgcloud/handlers/message.js`, `npx tgcloud push handlers/`): ينشر فقط تغييرات تلك الملفات. push موجّه لا يحذف وحدات أخرى. يمكن كتابة الهدف كمسار ملف، أو مسار داخل `tgcloud/`، أو اسم الوحدة — كلها نفس الوحدة.
- خياره الوحيد `--force` — لتخطّي فحص التقارب والكتابة فوق السحابة. استخدمه فقط عند اليقين.
- إن حدّد `tgcloud.jsonc` مجلد static، ينشره push الكامل في نفس الدفعة (فقط الملفات المتغيّرة) ويطبع عنوان الموقع. ابنِ أولًا. `npx tgcloud push dist/` ينشر الملفات الثابتة وحدها.
- بعد النشر، إن تغيّر `schema.js` وDB غير متزامن، يطبع ملخص التغييرات المعلّقة ويقترح `npx tgcloud migrate`، ولا يطبّقها بنفسه أبدًا.

### `migrate`

```
npx tgcloud migrate
```

يطبّق تغييرات مخططك على قاعدة البيانات. يحسب الفرق بين `schema.js` وDB الحيّة، ثم يمرّ بك خطوة بخطوة مع عدّاد `[N/M]`:

- ملخص موجز لكل التغييرات المعلّقة.
- **تغييرات آمنة** تُطبَّق معًا في خطوة واحدة بعد تأكيدك.
- **تحذيرات** (إسقاطات، عمليات بطيئة) واحدة تلو الأخرى، كل واحدة تُؤكَّد منفصلة.
- **تغييرات manual** تُعرض بسبب وإجراء مقترح، لا تُطبَّق تلقائيًا.
- **كائنات undocumented** (في DB لكن ليس في مخططك) تُعرض للعلم.

ينتهي بملخص: مطبّق، متخطّى، ينتظر إصلاحًا يدويًا، ليس في المخطط.

الأعلام: `--dry-run` (طباعة الكل، عدم تطبيق شيء)، `--safe` (تطبيق آمن تلقائيًا، تخطّي التحذيرات)، `--yes` (تطبيق آمن وكل تحذير تلقائيًا، تخطّي manual — بحذر)، `--local` (الفرق مقابل `schema.js` المحلي بدل المنشور). بدون علم، يحتاج `migrate` طرفية ويرمي خطأً في بيئة غير تفاعلية بدل التخمين.

### `run`

```
npx tgcloud run <module> [args] [--ctx <json5>]
```

ينفّذ handler أو endpoint على المنصة **بدون نشر**، باستخدام ملفاتك المحلية الحالية. هذه الحلقة الداخلية السريعة لاختبار المنطق.

- `<module>` — اسم مجرّد (يُبحث في `handlers/` و `endpoints/`) أو مسار مثل `handlers/message`. اسم موجود في كلا المجلدين يجب كتابته بمجلده.
- `[args]` — payload يُمرَّر للمعالج بصيغة [JSON5](https://json5.org) (يمكن تخطي تأطير المفاتيح). هو كائن نوع التحديث الذي يستقبله معالجك (مثل Message لـ `handlers/message`) أو `input` لـ endpoint، ويجب أن يكون **كائنًا** لا مصفوفة أو نصًّا مجرّدًا.
- `--ctx <json5>` — كائن سياق الوحدة (وسيطها الثاني)، JSON5 أيضًا. لتمرير ما يقرأه كودك من `ctx` — التحديث الخام لمعالج `--ctx '{ update: { update_id: 1 } }'`، أو init data لـ endpoint `--ctx '{ initData: { user: { id: 1 } } }'`. `run` لا يتحقق منه لأنك تختبر منطقك لا فحوص المنصة.

```
npx tgcloud run handlers/message '{ chat: { id: 1 }, text: "hi" }'
```

يشغّل المنصة الوحدة مقابل فضاء وحدات مبني من مشروعك **المحلي** (فيُستخدم كود `lib/` المعدّل محليًا)، ويُرجع القيمة المُرجَعة، وكل ما سُجِّل بـ `console.*`، والزمن المنقضي. اقرأ الوسائط الكبيرة من ملف: `npx tgcloud run handlers/message "$(cat message.json5)"`.

### `fetch`

```
npx tgcloud fetch
```

يفحص ما هو منشور حاليًا دون لمس ملفات عملك. بعده، يقارن `status` و `diff` مقابل أحدث حالة سحابية. مفيد لرؤية تعارض قبل تقرير كيفية حلّه.

### `pull`

```
npx tgcloud pull
```

يطابق مشروعك المحلي مع السحابة بتحديث ملفات عملك إلى الحالة المنشورة. `pull` لا يكتب مجلد build الخاص بـ Mini App أبدًا.

### `reset`

```
npx tgcloud reset
```

يتخلّى عن تغييراتك المحلية ويستعيد الوحدات من آخر حالة سحابية معروفة. استخدمه لرمي تجربة. لا يلمس مجلد build الخاص بـ Mini App.

### `webhook`

```
npx tgcloud webhook
npx tgcloud webhook sync [--drop-pending]
```

Telegram يسلّم التحديثات لبوتك عبر webhook تديره المنصة — لا توجّهه يدويًا أبدًا. `npx tgcloud webhook` يعرض حالته الحالية: الـ URL، قائمة `allowed_updates`، عدد التحديثات المعلّقة، آخر خطأ تسليم (إن وُجد)، وهل هو **in sync** مع معالجاتك المنشورة.

"in sync" تعني أن webhook يشير للمنصة و `allowed_updates` تطابق معالجاتك المنشورة — فيسلّم Telegram بالضبط أنواع التحديثات التي تعالجها. نشر معالج جديد (أو إزالة واحد) قد يترك webhook غير متزامن حتى يُحدَّث؛ `npx tgcloud status` يبلّغ عن ذلك أيضًا.

`npx tgcloud webhook sync` يصلحه — يعيد توجيه webhook للمنصة ويعيد بناء `allowed_updates` من معالجاتك المنشورة. أضف `--drop-pending` لتجاهل التحديثات التي صفّها Telegram قبل المزامنة (وإلا تُسلَّم بعد شفاء webhook).

### `completion`

> **ملاحظة:** إكمال tab يعمل فقط عندما يكون `tgcloud` مجرّد على `PATH` — ثبّته عامًا (`npm install -g @tgcloud/cli`) أو ضع binary على `PATH`. لا يمكنه الارتباط بـ `npx`.

```
tgcloud completion <bash|zsh|fish>
```

يطبع سكربت إكمال shell إلى stdout. فعّله مرة واحدة، ثم يكمل `<Tab>` الأوامر والأعلام ومجلدات الوحدات وأنواع تحديثات المعالجات التي لا تملكها بعد ووحداتك المحلية القابلة للتشغيل.

```bash
# bash — يحتاج حزمة bash-completion:
echo 'eval "$(tgcloud completion bash)"' >> ~/.bashrc

# zsh — تأكد من تشغيل `autoload -U compinit && compinit` في ~/.zshrc:
echo 'eval "$(tgcloud completion zsh)"' >> ~/.zshrc

# fish:
tgcloud completion fish > ~/.config/fish/completions/tgcloud.fish
```

أعد تشغيل shell (أو أعد تحميل الملف) بعدها. تشغيل `tgcloud completion` بلا shell يعرض هذه التعليمات مجددًا.

### `upgrade`

```
npx tgcloud upgrade [--dry-run]
```

ترحيل لمرة واحدة للمشاريع المنشأة قبل CLI 0.2.0، التي أبقَت `schema.js` و `lib/` و `handlers/` في جذر المشروع. ينقلها إلى `tgcloud/`. يبقى رابطك بالبوت ولا حاجة لإعادة النشر. `--dry-run` يطبع النقلات المخطّطة دون لمس شيء. الأوامر الأخرى لا تعمل على التصميم القديم حتى تُجري الترقية.

### البقاء متزامنًا (Staying in sync)

كل مشروع له **revision** متزايد رتيبًا في السحابة، يُرفَع عند كل نشر. الـ CLI يتذكّر آخر revision زامنه ويرسله مع كل `push`. إن تقدّمت السحابة — لأن جهازًا آخر أو زميلًا نشر — يُرفض push بدل الكتابة فوق عمله بصمت، ويقترح CLI ثلاثة طرق:

```
npx tgcloud fetch           # شاهد ما تغيّر في السحابة، ثم أعد الفحص
npx tgcloud pull            # اجلب الأحدث إلى ملفات عملك
npx tgcloud push --force    # اكتب فوق حالة السحابة (خطِر)
```

فحص التقارب التفاؤلي (optimistic concurrency) هو سبب قدرتك على مشاركة بوت مع فريق دون عملية نشر متزامنة صارمة. الأوامر تُخرج رمزًا non-zero عند الفشل — نشر مرفوض، migration فاشل، خطأ مصادقة، وحدة رمَت أثناء `run` — فتتكوّم بسلاسة في السكربتات وخطوط CI.

---

## ملخص الميزات الأساسية

| المجال | الميزات |
|---|---|
| **المنصة** | بدون بنية تحتية، مدمج بالكامل (Bot API + SQLite + HTTP)، تنفيذ V8 معزول وسريع، سير عمل مطوّر حقيقي |
| **المشروع** | مجلد `tgcloud/` واحد، `handlers/` (مسطّح)، `endpoints/` (مسطّح)، `lib/` (متداخل)، `schema.js`، `tgcloud.jsonc`، `.tgcloud/` |
| **الوحدات** | استيراد نسبي بـ `.js`، استيراد بالاسم، SDK فقط + وحداتك، لا npm/FS/شبكة إلا عبر SDK |
| **المعالجات** | نوع واحد لكل معالج، payload مفكوك، `ctx` اختياري، يُتجاهل بلا معالج |
| **النقاط (Endpoints)** | يتحقق من init data تلقائيًا، `ctx.initData` موثوق، `EndpointError`، يستدعيها `Telegram.WebApp.Serverless.call` |
| **Mini App** | استضافة build output، `app<app_id>.tgcloud.ai`، خيارات `spa`/`immutable`/`headers`/`redirects` |
| **قاعدة البيانات** | SQLite لكل بوت، صيغة Drizzle، أنواع + modes، فهارس/قيود، لا مفاتيح أجنبية، query builder غير متزامن، raw SQL، migrations (safe/warning/manual/undocumented) |
| **SDK** | `db`، `api` (كل دوال Bot API، غلاف مفكوك، `BotApiError`)، `InputFile`، تنزيل/دفق الملفات، `fetch` (streaming، أ Bodies، حد 30MB)، `console` |
| **CLI** | `init`, `add`, `login`, `status`, `diff`, `push`, `migrate`, `run`, `fetch`, `pull`, `reset`, `webhook`, `completion`, `upgrade` + مصادقة + تقارب تفاؤلي |
| **BotFather** | إدارة كاملة من الهاتف: Handlers، Endpoints، Library، Database، Mini App Files، CLI Access |
| **AI** | `AGENTS.md` + `docs/tgcloud-sdk.md` مولّدة تلقائيًا للوكلاء |
