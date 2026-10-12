// Pure formatting / math helpers. No SDK, no database — safe to import anywhere.

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function ltrNum(n) {
  return Number(n).toLocaleString('en-US');
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Level curve: each level needs XP_PER_LEVEL more than the previous.
export function levelFromXp(xp, perLevel) {
  let level = 1;
  let need = perLevel;
  let remaining = xp;
  while (remaining >= need) {
    remaining -= need;
    level++;
    need = perLevel * level;
  }
  return { level, into: remaining, need };
}

export function formatDuration(ms) {
  let s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  const parts = [];
  if (h) parts.push(`${h}س`);
  if (m) parts.push(`${m}د`);
  parts.push(`${s}ث`);
  return parts.join(' ');
}

export function userDisplay(user) {
  if (!user) return 'Player';
  return escapeHtml(user.name || user.username || `#${user.tgId}`);
}

// Truncate by Unicode code points (not UTF-16 units) so surrogate pairs
// (emoji, mathematical-bold letters, ...) are never split — a split pair
// produces invalid strings that Telegram rejects.
export function truncate(str, n) {
  if (str === null || str === undefined) return '';
  const chars = Array.from(String(str));
  return chars.length > n ? chars.slice(0, n - 1).join('') + '…' : chars.join('');
}
