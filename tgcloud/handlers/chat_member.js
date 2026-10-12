import { t } from '../lib/i18n.js';
import { DEFAULT_LANG } from '../lib/config.js';
import * as db from '../lib/db.js';
import { getSetting } from '../lib/settings.js';
import { sendMessage } from '../lib/ui.js';
import { escapeMd } from '../lib/format.js';

const IN = ['member', 'administrator', 'creator'];
const OUT = ['left', 'kicked'];

export default async function (update) {
  const chat = update.chat;
  const newMember = update.new_chat_member;
  const oldMember = update.old_chat_member;
  const who = update.from;

  if (!chat || !newMember || !oldMember) return;

  const becameMember = OUT.includes(oldMember.status) && IN.includes(newMember.status);
  const info = newMember.user;
  if (!becameMember || !info || info.is_bot) return;

  if (!(await getSetting('welcome'))) return;

  const user = await db.ensureUser(info);
  const lang = user.lang || DEFAULT_LANG;

  await sendMessage(
    chat.id,
    t(lang, 'group_welcome', { name: escapeMd(info.first_name || 'friend'), title: escapeMd(chat.title || '') }),
  );
}
