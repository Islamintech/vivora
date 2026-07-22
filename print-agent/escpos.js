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

function text(str) {
  // Default printer codepage is ASCII/CP437-ish; this covers plain Latin
  // text fine. Extended Uzbek Latin characters (oʻ, gʻ) may not render
  // correctly on every printer model — a known limitation of raw ESC/POS.
  return Buffer.from(str + '\n', 'latin1');
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
  chunks.push(FEED_AND_CUT);

  return Buffer.concat(chunks);
}

module.exports = { buildTicket };
