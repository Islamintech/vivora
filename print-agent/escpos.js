'use strict';

// Minimal ESC/POS command builder — no external dependency, just the raw
// byte sequences that SAM4S, Sewoo, Epson, Star, and virtually every other
// thermal kitchen printer understand.

const ESC = 0x1b;
const GS = 0x1d;

const INIT = Buffer.from([ESC, 0x40]);
const ALIGN_LEFT = Buffer.from([ESC, 0x61, 0]);
const ALIGN_CENTER = Buffer.from([ESC, 0x61, 1]);
const BOLD_ON = Buffer.from([ESC, 0x45, 1]);
const BOLD_OFF = Buffer.from([ESC, 0x45, 0]);
const DOUBLE_ON = Buffer.from([GS, 0x21, 0x11]); // double width + height
const DOUBLE_OFF = Buffer.from([GS, 0x21, 0x00]);
// Feed 3 lines then partial cut — leaves the ticket hanging for easy tear-off
// instead of dropping it, and works across the common printer brands.
const FEED_AND_CUT = Buffer.from([0x0a, 0x0a, 0x0a, GS, 0x56, 0x01]);

/**
 * Sound the printer's buzzer.
 *
 * A ticket is no use if nobody notices it: a kitchen is loud, and paper
 * appearing makes no sound at all.
 *
 * Two dialects, because no single one is universal:
 *   'escB' — ESC B n t, the SAM4S/Sewoo/Bixolon command. `times` beeps of
 *            `duration` × 100ms. This is the one to try first.
 *   'bel'  — a plain ASCII BEL per beep, understood by simpler firmware that
 *            ignores ESC B entirely.
 * A printer that knows neither prints nothing extra and stays silent, so
 * guessing wrong is harmless rather than a page of garbage.
 */
function beep(times = 3, duration = 2, mode = 'escB') {
  const n = Math.max(1, Math.min(9, Math.round(times)));
  const t = Math.max(1, Math.min(9, Math.round(duration)));
  if (mode === 'bel') return Buffer.from(new Array(n).fill(0x07));
  return Buffer.from([ESC, 0x42, n, t]);
}

// Uzbek Cyrillic -> Latin, so a menu typed in Cyrillic still prints something
// the kitchen can read. Multi-character replacements first, since 'ch'/'sh'
// must not be produced one letter at a time.
const CYRILLIC_TO_LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'g', ғ: "g'", д: 'd', е: 'e', ё: 'yo', ж: 'j',
  з: 'z', и: 'i', й: 'y', к: 'k', қ: 'q', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ў: "o'", ф: 'f', х: 'x', ҳ: 'h',
  ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: "'", ы: 'i', ь: '', э: 'e',
  ю: 'yu', я: 'ya',
};

/**
 * Thermal printers speak a single-byte codepage, not Unicode, so anything
 * outside ASCII has to be folded down before it is sent or it prints as
 * garbage (a proper Uzbek 'ʻ' came out as '»', Cyrillic as '>@8=').
 *
 * Menus are typed by restaurant staff on whatever keyboard they have, so we
 * cannot rely on them using the ASCII apostrophe - normalise instead of
 * hoping.
 */
function sanitize(str) {
  const chars = [...String(str)];
  let out = '';
  for (let idx = 0; idx < chars.length; idx++) {
    const ch = chars[idx];
    if (ch.charCodeAt(0) <= 126) {
      out += ch;
      continue;
    }
    // The turned/straight commas and curly quotes Uzbek Latin uses for oʻ/gʻ,
    // plus the apostrophes phone keyboards substitute automatically.
    if ('ʻʼ‘’`´'.includes(ch)) {
      out += "'";
      continue;
    }
    if (ch === '“' || ch === '”') { out += '"'; continue; }
    if (ch === '–' || ch === '—') { out += '-'; continue; }

    const lower = ch.toLowerCase();
    const mapped = CYRILLIC_TO_LATIN[lower];
    if (mapped !== undefined) {
      if (ch === lower) {
        out += mapped;
      } else {
        // Preserve casing, but only shout when the word itself is shouting:
        // ЛАҒМОН -> LAG'MON, while Шўрва -> Sho'rva rather than SHo'rva.
        const isUpperLetter = (c) =>
          !!c && c !== c.toLowerCase() && c === c.toUpperCase();
        // Look both ways, so the last letter of an all-caps word (the second
        // Ч of ЧЧ, with nothing after it) still shouts.
        const shouting =
          isUpperLetter(chars[idx + 1]) || isUpperLetter(chars[idx - 1]);
        out += shouting
          ? mapped.toUpperCase()
          : mapped.charAt(0).toUpperCase() + mapped.slice(1);
      }
      continue;
    }

    // Strip accents (é -> e) as a last resort before giving up on the char.
    const stripped = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    out += stripped.charCodeAt(0) <= 126 ? stripped : '?';
  }
  return out;
}

function text(str) {
  // Sanitised above to plain ASCII, so latin1 is a safe byte-per-char encode
  // on every printer's default codepage.
  return Buffer.from(sanitize(str) + '\n', 'latin1');
}

function line(width, char = '-') {
  return text(char.repeat(width));
}

// Currencies with no minor unit — printing "9500.00 KRW" would be wrong.
const ZERO_DECIMAL = new Set(['KRW', 'JPY', 'VND', 'CLP', 'ISK', 'KMF', 'XAF', 'XOF']);

/**
 * Money for a thermal ticket. Deliberately uses the ASCII currency code rather
 * than a symbol: ticket text is encoded latin1, which cannot represent ₩ (or
 * most non-latin symbols) — those would print as garbage.
 */
function money(amount, currency) {
  const code = (currency || '').trim();
  const digits = ZERO_DECIMAL.has(code.toUpperCase()) ? 0 : 2;
  const num = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount ?? 0);
  return code ? `${num} ${code}` : num;
}

// Left-justify a label against a right-justified value on one line, e.g.
// row(48, 'TOTAL', '$14.00') -> "TOTAL                                 $14.00"
function row(width, left, right) {
  const gap = Math.max(1, width - left.length - right.length);
  return text(left + ' '.repeat(gap) + right);
}

function wrap(str, width) {
  const words = str.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > width) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Builds a kitchen ticket for one order.
 * @param {object} opts
 * @param {string} opts.restaurantName
 * @param {number} opts.tableNumber
 * @param {{name: string, quantity: number, price: number, notes?: string}[]} opts.items
 * @param {number} opts.totalAmount
 * @param {string} opts.currency
 * @param {string} [opts.customerNote]
 * @param {boolean} [opts.takeOut] - print a prominent TAKE-OUT banner
 * @param {string} [opts.orderShortId] - last few chars of the order id, for reference
 * @param {Date} [opts.createdAt]
 * @param {number} [opts.width] - characters per line (48 for 80mm, 32 for 58mm)
 */
function buildTicket(opts) {
  const width = opts.width || 48;
  const fmt = (n) => money(n, opts.currency);
  const chunks = [INIT];

  // Normalise every staff-typed string up front: transliteration changes a
  // string's length (ё -> yo), so the column arithmetic below has to run on
  // the text that will actually be printed, not the original.
  opts = {
    ...opts,
    restaurantName: opts.restaurantName && sanitize(opts.restaurantName),
    customerNote: opts.customerNote && sanitize(opts.customerNote),
    items: (opts.items || []).map((i) => ({
      ...i,
      name: sanitize(i.name),
      notes: i.notes && sanitize(i.notes),
    })),
  };

  chunks.push(ALIGN_CENTER, BOLD_ON, DOUBLE_ON);
  chunks.push(text(opts.restaurantName || 'Restaurant'));
  chunks.push(DOUBLE_OFF);
  chunks.push(text(`TABLE ${opts.tableNumber}`));
  // Take-out has to be impossible to miss — the kitchen packs it differently.
  if (opts.takeOut) {
    chunks.push(DOUBLE_ON, text('** TAKE-OUT **'), DOUBLE_OFF);
  }
  chunks.push(BOLD_OFF, ALIGN_LEFT);
  chunks.push(line(width));

  const when = opts.createdAt ? new Date(opts.createdAt) : new Date();
  const stamp = when.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  chunks.push(row(width, stamp, opts.orderShortId ? `#${opts.orderShortId}` : ''));
  chunks.push(line(width));

  for (const item of opts.items) {
    const qtyName = `${item.quantity}x ${item.name}`;
    const priceStr = fmt(item.price * item.quantity);
    const nameWidth = width - priceStr.length - 1;
    const wrapped = wrap(qtyName, nameWidth);
    chunks.push(row(width, wrapped[0], priceStr));
    for (const extra of wrapped.slice(1)) chunks.push(text('  ' + extra));
    if (item.notes) {
      for (const noteLine of wrap(`* ${item.notes}`, width - 2)) {
        chunks.push(text('  ' + noteLine));
      }
    }
  }

  chunks.push(line(width));
  chunks.push(BOLD_ON);
  chunks.push(row(width, 'TOTAL', fmt(opts.totalAmount)));
  chunks.push(BOLD_OFF);

  if (opts.customerNote) {
    chunks.push(line(width));
    for (const noteLine of wrap(`Note: ${opts.customerNote}`, width)) {
      chunks.push(text(noteLine));
    }
  }

  chunks.push(line(width));

  // A single-item order prints a stub barely longer than a thumb: fiddly to
  // tear off, easy to lose on a busy pass. Pad short tickets up to a minimum
  // so every one is the same comfortable size to grab, while a long order
  // stays exactly as long as it needs to be.
  const minLines = opts.minLines || 0;
  if (minLines > 0) {
    const printed = Buffer.concat(chunks).filter((b) => b === 0x0a).length;
    const padding = minLines - printed;
    if (padding > 0) chunks.push(Buffer.alloc(padding, 0x0a));
  }

  chunks.push(FEED_AND_CUT);

  // After the cut, so the buzzer sounds once the ticket is actually there to
  // be torn off rather than while it is still feeding.
  if (opts.beep) {
    const b = opts.beep === true ? {} : opts.beep;
    chunks.push(beep(b.times ?? 3, b.duration ?? 2, b.mode ?? 'escB'));
  }

  return Buffer.concat(chunks);
}

module.exports = { buildTicket, sanitize, beep };
