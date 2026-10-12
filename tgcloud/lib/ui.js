import { api } from 'sdk';

// Thin wrappers around the Bot API that swallow "not modified" / "message gone" errors,
// so handlers never crash on a stale button press.

const SILENT_CODES = [400]; // e.g. "message is not modified", "message to edit not found"

async function guard(fn) {
  try {
    return await fn();
  } catch (e) {
    if (e && typeof e.code === 'number' && SILENT_CODES.includes(e.code)) return null;
    throw e;
  }
}

export function sendMessage(chatId, text, options = {}) {
  return api.sendMessage({
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    ...options,
  });
}

export function editMessage(chatId, messageId, text, options = {}) {
  return guard(() =>
    api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      ...options,
    }),
  );
}

// Edit the existing message when we have its id, otherwise send a new one.
export function render(chatId, messageId, text, options = {}) {
  if (messageId) return editMessage(chatId, messageId, text, options);
  return sendMessage(chatId, text, options);
}

export function editInline(inlineMessageId, text, options = {}) {
  return guard(() =>
    api.editMessageText({
      inline_message_id: inlineMessageId,
      text,
      parse_mode: 'Markdown',
      ...options,
    }),
  );
}

export function answerCallback(callbackQueryId, text, options = {}) {
  return guard(() =>
    api.answerCallbackQuery({
      callback_query_id: callbackQueryId,
      text,
      ...options,
    }),
  );
}

export function sendPhoto(chatId, photo, options = {}) {
  return api.sendPhoto({ chat_id: chatId, photo, ...options });
}
