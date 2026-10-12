import { DEFAULT_LANG, LANGS } from './config.js';

// All user-facing strings live here. `t(lang, key, vars)` substitutes {placeholders}.
const STRINGS = {
  ar: {
    // generic
    back: '⬅️ رجوع',
    close: '❌ إغلاق',
    cancel: 'إلغاء',
    yes: '✅ نعم',
    no: '❌ لا',
    confirm: 'تأكيد',
    loading: 'جارٍ...',
    unknown: 'أمر غير معروف.',
    not_enough_coins: 'ليس لديك عملات كافية.',
    you_are_banned: '🚫 أنت محظور من استخدام البوت.',
    notif_banned: '🚫 تم حظرك من البوت.',
    notif_unbanned: '✅ تم رفع الحظر عنك، مرحبًا بعودتك!',
    notif_coins: '💰 تم منحك {amount} {currency}!',
    maintenance: '🛠️ البوت في وضع الصيانة حاليًا. عد لاحقًا.',
    dev_only: '⛔ هذا الأمر للمطور فقط.',
    registered: '✅ تم تسجيلك بنجاح!',
    welcome_back: 'مرحبًا بعودتك، {name}!',

    // menu
    menu_title: '🏠 *القائمة الرئيسية*\nاختر من الأزرار أدناه:',
    btn_games: '🎮 الألعاب',
    btn_profile: '👤 الملف الشخصي',
    btn_top: '🏆 المتصدرين',
    btn_daily: '🎁 المكافأة اليومية',
    btn_shop: '🛒 المتجر',
    btn_stats: '📊 إحصائياتي',
    btn_ref: '👥 الإحالات',
    btn_ach: '🏅 الإنجازات',
    btn_help: '❓ المساعدة',
    btn_about: 'ℹ️ عن البوت',
    btn_settings: '🌐 اللغة',
    btn_app: '🎡 التطبيق المصغّر',
    btn_dev: '🛡️ لوحة المطور',

    // inline mode
    inl_level: '⭐ المستوى',
    inl_plays: '🎮 الألعاب',
    inl_wins: '🏆 الانتصارات',
    inl_rank: '🏅 الترتيب',
    inl_play: '🎮 العب معي',
    inl_pvp: '🤝 1v1',
    inl_pvp_desc: 'ألعب ضد صديق',
    inl_pvp_text: 'لعبة بين صديقين — صديقك يضغط انضمام ليلعب معك',
    inl_join: '➕ انضم',
    ib_start: '🎮 ابدأ',
    ib_desc: 'العب ضد البوت',
    ib_try_inline: '🎮 جرّب اللعب بالأنلاين',
    ib_sent: '🗨️ أُرسلت اللعبة إلى محادثتنا الخاصة — العب هناك!',
    pvp_lobby: '🕹️ غرفة 1v1\n\n{name} أخذ المقعد الأول ❌\nصديقك يضغط «➕ انضم» ليأخذ المقعد ⭕',

    // start
    start_text:
      '👋 مرحبًا *{name}*!\n\n' +
      '🤖 أنا بوت متكامل يعمل على ⚡️ *Telegram Serverless* — على بنية تيليجرام مباشرةً دون الحاجة إلى سيرفر خاص.\n' +
      '🎮 ألعاب • 🪙 اقتصاد • 🏅 إنجازات • والمزيد.\n\n' +
      'استخدم الأزرار للتنقل أو أرسل /help.',
    group_welcome: '👋 أهلًا {name} في *{title}*! أرسل /start لرؤية الألعاب.',
    ref_welcome: '\n\n🎉 انضممت عبر دعوة من {name}! حصلت على {bonus} {currency}',

    // profile
    profile_title: '👤 *الملف الشخصي*',
    profile_body:
      '🆔 ايدي: `{id}`\n' +
      '📛 الاسم: {name}\n' +
      '⭐ المستوى: {level}\n' +
      '✨ الخبرة: {xp}/{xpNext}\n' +
      '🪙 العملات: {coins}\n' +
      '💎 الجواهر: {gems}\n' +
      '🎮 مرات اللعب: {plays}\n' +
      '🏆 الانتصارات: {wins}\n' +
      '📉 الخسائر: {losses}\n' +
      '🔥 سلسلة الانتصارات: {streak}\n' +
      '🥇 أفضل سلسلة: {bestStreak}\n' +
      '💎 بريميوم: {premium}',

    // daily
    daily_ready: '🎁 حصلت على مكافأتك اليومية: *{amount}* {currency}\n🔥 السلسلة: {streak} يوم',
    daily_wait: '⏳ لقد حصلت على مكافأتك بالفعل.\nعد بعد: *{time}*',

    // games
    games_title: '🎮 *الألعاب*\nاختر لعبة للعب:',
    game_disabled: '🚫 هذه اللعبة معطّلة حاليًا.',
    number_invalid: '❗ الرجاء إدخال رقم صالح.',
    you_won: '🎉 *فزت!* ربحت {reward} {currency}',
    you_lost: '😔 *خسرت!* لا بأس، جرّب مرة أخرى.',
    loss_penalty: '💸 تم خصم {amount} {currency}',
    draw: '🤝 *تعادل!*',
    play_again: '🔁 العب مرة أخرى',

    // games names
    g_dice: 'تحدي الأرقام',
    g_guess: 'تخمين الرقم',
    g_quiz: 'الاختبار',
    g_rps: 'حجر ورقة مقص',
    g_slots: 'مطابقة الفواكه',
    g_tictactoe: 'إكس-أو',
    g_math: 'تحدي الرياضيات',
    g_flip: 'رمي العملة',
    g_highlow: 'أعلى/أدنى',
    g_word: 'ترتيب الكلمات',

    // specific games
    dice_roll: '🔢 رقمك: *{you}*\n🤖 رقم البوت: *{bot}*',
    guess_prompt: '🔢 خمّن رقمًا بين 1 و 100.\nلديك {tries} محاولات.',
    guess_higher: '⬆️ الرقم أعلى! المتبقي: {tries}',
    guess_lower: '⬇️ الرقم أقل! المتبقي: {tries}',
    guess_won: '🎉 صحيح! الرقم كان {n}.\nربحت {reward} {currency}',
    guess_lost: '😔 انتهت المحاولات! الرقم كان {n}.',
    quiz_question: '❓ *{q}*\n\n{options}',
    quiz_correct: '✅ إجابة صحيحة! ربحت {reward} {currency}',
    quiz_wrong: '❌ إجابة خاطئة! الإجابة الصحيحة: {answer}',
    quiz_timeout: '⏰ انتهى الوقت!',
    rps_prompt: '✊✋✌️ اختر:',
    rps_result: 'أنت: {you}\nالبوت: {bot}\n\n{outcome}',
    rps_rock: '✊ حجر',
    rps_paper: '✋ ورقة',
    rps_scissors: '✌️ مقص',
    slots_spin: '🍒 النتيجة:',
    slots_win: '🎉 فوز! +{reward} {currency}',
    ttt_your_turn: '❌⭕ دورك! (أنت X)',
    ttt_bot_thinking: '🤖 يفكر البوت...',
    ttt_win: '🎉 فزت على البوت! +{reward} {currency}',
    ttt_lose: '😔 فاز البوت!',
    ttt_draw: '🤝 تعادل!',
    math_prompt: '➗ ما ناتج: *{a} {op} {b}* = ؟',
    math_correct: '✅ صحيح! ربحت {reward} {currency}',
    math_wrong: '❌ خطأ! الجواب كان {answer}',
    flip_prompt: '🪙 اختر وجه العملة:',
    flip_heads: 'صورة',
    flip_tails: 'كتابة',
    flip_result: '🪙 النتيجة: {side}\n{outcome}',
    highlow_prompt: '⬆️⬇️ الرقم الحالي: *{n}*\nهل التالي أعلى أم أدنى؟',
    highlow_higher: '⬆️ أعلى',
    highlow_lower: '⬇️ أدنى',
    highlow_result: 'الرقم التالي: *{next}*\n{outcome}',
    word_prompt: '🔤 رتّب الكلمة: `{scrambled}`',
    word_correct: '✅ صحيح! ربحت {reward} {currency}',
    word_wrong: '❌ خطأ! الكلمة كانت: *{answer}*',

    // stats
    stats_title: '📊 *إحصائياتي*',
    stats_rank: '🏅 ترتيبك: #{rank}',

    // leaderboard
    top_title: '🏆 *أفضل 10 لاعبين*',
    top_empty: 'لا يوجد لاعبون بعد.',
    top_line: '{rank}. {name} — {coins} {currency} (مستوى {level})',

    // shop / referral / achievements / settings
    shop_title: '🛒 *المتجر*\nرصيدك: {coins} {currency} | {gems} 💎',
    shop_hint: 'اختر غرضاً للشراء من الأزرار 👇',
    shop_bought: '✅ تم الشراء!',
    shop_no_gems: '💎 لا تملك جواهر كافية.',
    shop_owned: '✅ تملك هذا بالفعل.',
    ref_title: '👥 *الإحالات*',
    ref_body:
      'رابط دعوتك:\n`{link}`\n\nعدد المدعوين: {count}\nمكافأة كل دعوة: {bonus} {currency}',
    ach_title: '🏅 *الإنجازات*',
    ach_locked: '🔒',
    ach_unlocked: 'مفتوح: {name}',
    settings_title: '🌐 *اللغة*',
    lang_changed: '✅ تم تغيير اللغة.',
    help_title: '❓ *المساعدة*',
    help_body:
      'الأوامر المتاحة:\n' +
      '/start — القائمة الرئيسية\n' +
      '/games — الألعاب\n' +
      '/daily — المكافأة اليومية\n' +
      '/profile — ملفك\n' +
      '/top — المتصدرين\n' +
      '/about — عن البوت\n' +
      '/help — المساعدة',
    about_title: 'ℹ️ *عن البوت*',
    about_body:
      '🤖 *بوت ألعاب واقتصاد متكامل:*\n' +
      '🎮 10 ألعاب (فردية وخلف البوت، وبعضها 1v1 داخل الدردشة)\n' +
      '🪙 عملات وجواهر ومتجر ومكافأة يومية\n' +
      '🏅 مستويات وإنجازات ولوحة متصدرين\n' +
      '👥 نظام إحالات ومكافآت\n\n' +
      '⚡️ يعمل هذا البوت على *Telegram Serverless*\n' +
      'وهي خدمة تجريبية (Early Access) مقدّمة من تيليجرام، تشغّل البوتات وأكوادها وقواعد بياناتها مباشرةً على البنية التحتية لتيليجرام دون الحاجة إلى سيرفرات خاصة.\n' +
      '🧪 ولأنها تجريبية، قد تلاحظ أحيانًا بعض البطء أو أخطاءً بسيطة.\n\n' +
      '📖 التوثيق: https://core.telegram.org/bots/serverless',
    open_source: '📖 هذا المشروع *مفتوح المصدر* على GitHub:\n{repo}',
    btn_github: '⭐ الكود المصدري',
    follow_title: '📣 تابع جديدنا',
    our_links: '📣 *تابع جديدنا*\n\n• قناة تيليجرام: {channel}\n• موقعنا الإلكتروني: {site}',
    btn_channel: '📣 تابع جديدنا',
    btn_website: '🌐 موقعنا',
    rate_repo: '⭐ يرجى ترك تقييم لدعمنا على GitHub',
    btn_rate: '⭐ قيّم المشروع على GitHub',

    // admin
    admin_title: '🛡️ *لوحة المطور*',
    admin_stats: '📊 الإحصائيات',
    admin_broadcast: '📢 بث رسالة',
    admin_users: '👥 المستخدمون',
    admin_search: '🔍 بحث عن مستخدم',
    admin_games: '🎛️ إدارة الألعاب',
    admin_maintenance: '🛠️ الصيانة',
    admin_log: '📜 سجل النشاط',
    admin_storage: '🗄️ التخزين (ويب)',
    admin_give: '💰 منح عملات',
    admin_ban: '🚫 حظر',
    admin_dm: '✉️ مراسلة مستخدم',
    broadcast_choose_mode: '📢 اختر طريقة البث أولًا:',
    broadcast_prompt: '📢 أرسل الرسالة التي تريد بثّها (نص، صورة، فيديو، ملف، ملصق…)، أو /cancel.',
    broadcast_mode_copy: '📨 إرسال مباشر',
    broadcast_mode_forward: '↪️ إعادة توجيه',
    broadcast_sending: '📤 جارٍ الإرسال...',
    broadcast_done: '✅ تم البث إلى {sent} من {total} مستخدم.',
    dev_stats_body:
      '👥 المستخدمون: {total}\n' +
      '🚫 المحظورون: {banned}\n' +
      '💎 بريميوم: {premium}\n' +
      '🎮 الألعاب الملعوبة: {games}\n' +
      '🪙 إجمالي العملات: {coins}\n' +
      '🛠️ الصيانة: {maint}',
    dev_games_hint: 'اضغط على لعبة لتفعيلها أو تعطيلها:',
    dev_give_usage: 'الصيغة: <ايدي> <المبلغ>',
    dev_gave: '✅ تم منح {amount} {currency} للمستخدم {tgId}',
    dev_dm_usage: 'الصيغة: <ايدي> <الرسالة>',
    dev_search_prompt: '🔍 أرسل ايدي العضو للبحث، أو /cancel.',
    send_ok: 'تم',
    dev_new_user:
      '🆕 عضو جديد دخل البوت!\n' +
      '👤 {name}\n' +
      '🆔 ايدي: `{id}`\n' +
      '👥 {username}\n' +
      '🪙 رصيده الابتدائي: {coins} {currency}',
  },

  en: {
    back: '⬅️ Back',
    close: '❌ Close',
    cancel: 'Cancel',
    yes: '✅ Yes',
    no: '❌ No',
    confirm: 'Confirm',
    loading: 'Loading...',
    unknown: 'Unknown command.',
    not_enough_coins: "You don't have enough coins.",
    you_are_banned: '🚫 You are banned from using the bot.',
    notif_banned: '🚫 You have been banned from the bot.',
    notif_unbanned: '✅ Your ban was lifted, welcome back!',
    notif_coins: '💰 You were granted {amount} {currency}!',
    maintenance: '🛠️ The bot is under maintenance. Come back later.',
    dev_only: '⛔ Developer only.',
    registered: '✅ You are registered!',
    welcome_back: 'Welcome back, {name}!',

    menu_title: '🏠 *Main menu*\nPick an option below:',
    btn_games: '🎮 Games',
    btn_profile: '👤 Profile',
    btn_top: '🏆 Leaderboard',
    btn_daily: '🎁 Daily bonus',
    btn_shop: '🛒 Shop',
    btn_stats: '📊 My stats',
    btn_ref: '👥 Referrals',
    btn_ach: '🏅 Achievements',
    btn_help: '❓ Help',
    btn_about: 'ℹ️ About',
    btn_settings: '🌐 Language',
    btn_app: '🎡 Mini App',
    btn_dev: '🛡️ Developer',

    // inline mode
    inl_level: '⭐ Level',
    inl_plays: '🎮 Plays',
    inl_wins: '🏆 Wins',
    inl_rank: '🏅 Rank',
    inl_play: '🎮 Play with me',
    inl_pvp: '🤝 1v1',
    inl_pvp_desc: 'Play against a friend',
    inl_pvp_text: 'A two-player game — a friend taps Join to play you',
    inl_join: '➕ Join',
    ib_start: '🎮 Start',
    ib_desc: 'Play against the bot',
    ib_try_inline: '🎮 Try inline play',
    ib_sent: '🗨️ The game was sent to our private chat — play there!',
    pvp_lobby: '🕹️ 1v1 room\n\n{name} took seat 1 ❌\nA friend taps “➕ Join” to take seat 2 ⭕',

    start_text:
      '👋 Hi *{name}*!\n\n' +
      '🤖 I am a full-featured bot running on ⚡️ *Telegram Serverless* — directly on Telegram\'s infrastructure, with no private server needed.\n' +
      '🎮 Games • 🪙 Economy • 🏅 Achievements • and more.\n\n' +
      'Use the buttons or send /help.',
    group_welcome: '👋 Welcome {name} to *{title}*! Send /start to see the games.',
    ref_welcome: '\n\n🎉 You joined via {name}\'s invite! You got {bonus} {currency}',

    profile_title: '👤 *Profile*',
    profile_body:
      '🆔 ID: `{id}`\n' +
      '📛 Name: {name}\n' +
      '⭐ Level: {level}\n' +
      '✨ XP: {xp}/{xpNext}\n' +
      '🪙 Coins: {coins}\n' +
      '💎 Gems: {gems}\n' +
      '🎮 Plays: {plays}\n' +
      '🏆 Wins: {wins}\n' +
      '📉 Losses: {losses}\n' +
      '🔥 Streak: {streak}\n' +
      '🥇 Best streak: {bestStreak}\n' +
      '💎 Premium: {premium}',

    daily_ready: '🎁 Daily bonus claimed: *{amount}* {currency}\n🔥 Streak: {streak} days',
    daily_wait: '⏳ You already claimed today.\nCome back in: *{time}*',

    games_title: '🎮 *Games*\nPick a game to play:',
    game_disabled: '🚫 This game is disabled right now.',
    number_invalid: '❗ Please enter a valid number.',
    you_won: '🎉 *You won!* +{reward} {currency}',
    you_lost: '😔 *You lost!* No worries, try again.',
    loss_penalty: '💸 Deducted {amount} {currency}',
    draw: '🤝 *Draw!*',
    play_again: '🔁 Play again',

    g_dice: 'Number duel',
    g_guess: 'Guess the number',
    g_quiz: 'Trivia',
    g_rps: 'Rock Paper Scissors',
    g_slots: 'Fruit match',
    g_tictactoe: 'Tic-Tac-Toe',
    g_math: 'Math challenge',
    g_flip: 'Coin flip',
    g_highlow: 'High/Low',
    g_word: 'Word scramble',

    dice_roll: '🔢 Your number: *{you}*\n🤖 Bot number: *{bot}*',
    guess_prompt: '🔢 Guess a number between 1 and 100.\nYou have {tries} tries.',
    guess_higher: '⬆️ Higher! Left: {tries}',
    guess_lower: '⬇️ Lower! Left: {tries}',
    guess_won: '🎉 Correct! The number was {n}.\nYou won {reward} {currency}',
    guess_lost: '😔 Out of tries! The number was {n}.',
    quiz_question: '❓ *{q}*\n\n{options}',
    quiz_correct: '✅ Correct! +{reward} {currency}',
    quiz_wrong: '❌ Wrong! The answer was: {answer}',
    quiz_timeout: '⏰ Time is up!',
    rps_prompt: '✊✋✌️ Choose:',
    rps_result: 'You: {you}\nBot: {bot}\n\n{outcome}',
    rps_rock: '✊ Rock',
    rps_paper: '✋ Paper',
    rps_scissors: '✌️ Scissors',
    slots_spin: '🍒 Result:',
    slots_win: '🎉 Win! +{reward} {currency}',
    ttt_your_turn: '❌⭕ Your turn! (You are X)',
    ttt_bot_thinking: '🤖 Bot is thinking...',
    ttt_win: '🎉 You beat the bot! +{reward} {currency}',
    ttt_lose: '😔 The bot won!',
    ttt_draw: '🤝 Draw!',
    math_prompt: '➗ Solve: *{a} {op} {b}* = ?',
    math_correct: '✅ Correct! +{reward} {currency}',
    math_wrong: '❌ Wrong! Answer was {answer}',
    flip_prompt: '🪙 Pick a side:',
    flip_heads: 'Heads',
    flip_tails: 'Tails',
    flip_result: '🪙 Result: {side}\n{outcome}',
    highlow_prompt: '⬆️⬇️ Current number: *{n}*\nIs the next one higher or lower?',
    highlow_higher: '⬆️ Higher',
    highlow_lower: '⬇️ Lower',
    highlow_result: 'Next number: *{next}*\n{outcome}',
    word_prompt: '🔤 Unscramble: `{scrambled}`',
    word_correct: '✅ Correct! +{reward} {currency}',
    word_wrong: '❌ Wrong! The word was: *{answer}*',

    stats_title: '📊 *My stats*',
    stats_rank: '🏅 Your rank: #{rank}',

    top_title: '🏆 *Top 10 players*',
    top_empty: 'No players yet.',
    top_line: '{rank}. {name} — {coins} {currency} (level {level})',

    shop_title: '🛒 *Shop*\nBalance: {coins} {currency} | {gems} 💎',
    shop_hint: 'Pick an item to buy from the buttons 👇',
    shop_bought: '✅ Purchased!',
    shop_no_gems: "💎 You don't have enough gems.",
    shop_owned: '✅ You already own this.',
    ref_title: '👥 *Referrals*',
    ref_body: 'Your invite link:\n`{link}`\n\nInvited: {count}\nReward each: {bonus} {currency}',
    ach_title: '🏅 *Achievements*',
    ach_locked: '🔒',
    ach_unlocked: 'Unlocked: {name}',
    settings_title: '🌐 *Language*',
    lang_changed: '✅ Language changed.',
    help_title: '❓ *Help*',
    help_body:
      'Available commands:\n' +
      '/start — main menu\n' +
      '/games — games\n' +
      '/daily — daily bonus\n' +
      '/profile — your profile\n' +
      '/top — leaderboard\n' +
      '/about — about the bot\n' +
      '/help — help',
    about_title: 'ℹ️ *About the bot*',
    about_body:
      '🤖 *A full-featured games & economy bot:*\n' +
      '🎮 10 games (solo, vs-bot, and some 1v1 in-chat)\n' +
      '🪙 Coins, gems, a shop and a daily bonus\n' +
      '🏅 Levels, achievements and a leaderboard\n' +
      '👥 A referral & rewards system\n\n' +
      '⚡️ This bot runs on *Telegram Serverless*\n' +
      'an Early Access service from Telegram that runs bots, their code and databases directly on Telegram\'s infrastructure — with no private servers.\n' +
      '🧪 As it is experimental, you may sometimes notice slight slowness or minor errors.\n\n' +
      '📖 Docs: https://core.telegram.org/bots/serverless',
    open_source: '📖 This project is *open source* on GitHub:\n{repo}',
    btn_github: '⭐ Source code',
    follow_title: '📣 Follow our updates',
    our_links: '📣 *Follow our updates*\n\n• Telegram channel: {channel}\n• Website: {site}',
    btn_channel: '📣 Follow our updates',
    btn_website: '🌐 Website',
    rate_repo: '⭐ Please leave a rating to support us on GitHub',
    btn_rate: '⭐ Rate the project on GitHub',

    admin_title: '🛡️ *Developer panel*',
    admin_stats: '📊 Statistics',
    admin_broadcast: '📢 Broadcast',
    admin_users: '👥 Users',
    admin_search: '🔍 Search user',
    admin_games: '🎛️ Manage games',
    admin_maintenance: '🛠️ Maintenance',
    admin_log: '📜 Activity log',
    admin_storage: '🗄️ Storage (web)',
    admin_give: '💰 Give coins',
    admin_ban: '🚫 Ban',
    admin_dm: '✉️ Message user',
    broadcast_choose_mode: '📢 Choose the broadcast mode first:',
    broadcast_prompt: '📢 Send the message to broadcast (text, photo, video, file, sticker…), or /cancel.',
    broadcast_mode_copy: '📨 Send directly',
    broadcast_mode_forward: '↪️ Forward',
    broadcast_sending: '📤 Sending...',
    broadcast_done: '✅ Broadcast sent to {sent} of {total} users.',
    dev_stats_body:
      '👥 Users: {total}\n' +
      '🚫 Banned: {banned}\n' +
      '💎 Premium: {premium}\n' +
      '🎮 Games played: {games}\n' +
      '🪙 Total coins: {coins}\n' +
      '🛠️ Maintenance: {maint}',
    dev_games_hint: 'Tap a game to enable or disable it:',
    dev_give_usage: 'Format: <id> <amount>',
    dev_gave: '✅ Gave {amount} {currency} to user {tgId}',
    dev_dm_usage: 'Format: <id> <message>',
    dev_search_prompt: '🔍 Send the member ID to search, or /cancel.',
    send_ok: 'Sent',
    dev_new_user:
      '🆕 New member joined the bot!\n' +
      '👤 {name}\n' +
      '🆔 ID: `{id}`\n' +
      '👥 {username}\n' +
      '🪙 Starting balance: {coins} {currency}',
  },
};

export function normalizeLang(lang) {
  return LANGS.includes(lang) ? lang : DEFAULT_LANG;
}

/** Pick a supported language from a Telegram `language_code` (e.g. "ar", "en-US"). */
export function detectLang(languageCode) {
  const base = String(languageCode || '')
    .toLowerCase()
    .split(/[-_]/)[0];
  return LANGS.includes(base) ? base : DEFAULT_LANG;
}

export function t(lang, key, vars) {
  const table = STRINGS[normalizeLang(lang)] || STRINGS[DEFAULT_LANG];
  let str = table[key] ?? STRINGS[DEFAULT_LANG][key] ?? key;
  if (vars) {
    for (const k of Object.keys(vars)) {
      str = str.split(`{${k}}`).join(String(vars[k]));
    }
  }
  return str;
}
