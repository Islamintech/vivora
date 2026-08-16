'use strict';

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { createClient } = require('graphql-ws');
const { login, getMyRestaurant, markOrderPreparing } = require('./graphql');
const { buildTicket, beep, drawerKick } = require('./escpos');
const { printToNetwork, printToSerial } = require('./printer');

const CONFIG_PATH = process.argv.find((a, i) => i >= 2 && !a.startsWith('--'))
  || path.join(__dirname, 'config.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(
      `Config file not found at ${CONFIG_PATH}.\n` +
      `Copy config.example.json to config.json and fill in your details, then run again.`,
    );
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  for (const field of ['apiUrl', 'wsUrl', 'email', 'password']) {
    if (!cfg[field]) {
      console.error(`config.json is missing required field "${field}".`);
      process.exit(1);
    }
  }
  return cfg;
}

const LOG_PATH = path.join(__dirname, 'print-agent.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_PATH, line + '\n');
    // Keep the log file from growing forever on a machine nobody watches.
    const stat = fs.statSync(LOG_PATH);
    if (stat.size > 2 * 1024 * 1024) {
      const tail = fs.readFileSync(LOG_PATH, 'utf8').slice(-500_000);
      fs.writeFileSync(LOG_PATH, tail);
    }
  } catch {
    // Logging to disk is best-effort; never crash the agent over it.
  }
}

const config = loadConfig();

// Re-login proactively before the 7-day JWT expiry, and reactively if the
// server ever rejects the current token. `session.token` is read fresh by
// the subscription client's connectionParams on every (re)connect.
const session = { token: null, restaurantId: null, restaurant: null };

async function authenticate() {
  const { token, user } = await login(config.apiUrl, config.email, config.password);
  session.token = token;
  session.restaurantId = user.restaurantId;
  session.restaurant = await getMyRestaurant(config.apiUrl, token);
  log(
    `Authenticated as ${config.email} for restaurant "${session.restaurant.name}" ` +
    `(${session.restaurantId}).`,
  );
}

/**
 * One printer's settings, from either a `printers[]` entry or the flat
 * top-level fields. A serial port wins when one is configured: a printer
 * wired to the till's COM port has no network address to fall back to, and
 * the dashboard's printerIp field cannot describe it.
 */
function describePrinter(entry, fallbackName) {
  const name = entry.name || fallbackName;
  const width = entry.paperWidth || config.paperWidth || 48;
  // `beep: false` on one printer has to win over a global `beep: true`, so
  // check for the key rather than falling back on truthiness.
  const beepCfg = entry.beep !== undefined ? entry.beep : config.beep;
  const bellCfg = entry.bell !== undefined ? entry.bell : config.bell;
  const minLines = entry.minTicketLines ?? config.minTicketLines ?? 0;

  if (entry.serialPort) {
    const port = String(entry.serialPort).toUpperCase();
    const baud = entry.serialBaud || config.serialBaud || 9600;
    // 10s is generous at 9600 baud (~960 bytes/s against a ~600-byte ticket)
    // while still failing fast enough for the retry to mean something.
    const timeoutMs = entry.printTimeoutMs || config.printTimeoutMs || 10000;
    return {
      kind: 'serial', name, width, port, baud, timeoutMs, beep: beepCfg, bell: bellCfg, minLines,
      describe: `${name} (${port} @ ${baud} baud)`,
    };
  }

  const ip = entry.printerIp || session.restaurant?.printerIp;
  const port = entry.printerIp
    ? (entry.printerPort || 9100)
    : (session.restaurant?.printerPort || 9100);
  return { kind: 'network', name, width, ip, port, beep: beepCfg, bell: bellCfg, minLines, describe: `${name} (${ip}:${port})` };
}

/**
 * Every printer a ticket should go to.
 *
 * A kitchen commonly runs more than one - one at the stove, one at the pass
 * by the display - and both want the same ticket. `printers[]` lists them;
 * the older single-printer config keeps working untouched, since a restaurant
 * that already has a working setup should not have to rewrite it.
 */
function effectivePrinters() {
  if (Array.isArray(config.printers) && config.printers.length) {
    return config.printers.map((p, i) => describePrinter(p, `Printer ${i + 1}`));
  }
  return [describePrinter(config, 'Printer')];
}

function sendToPrinter(target, buffer) {
  return target.kind === 'serial'
    ? printToSerial(target.port, buffer, {
        baud: target.baud,
        timeoutMs: target.timeoutMs,
      })
    : printToNetwork(target.ip, target.port, buffer);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// At boot the PC is up well before the network is, so the first login almost
// always fails on a machine that starts the agent automatically. Never give
// up: back off up to a minute and keep trying until the connection comes back.
async function authenticateWithRetry() {
  for (let attempt = 1; ; attempt++) {
    try {
      await authenticate();
      return;
    } catch (err) {
      const wait = Math.min(60_000, 3000 * attempt);
      log(`Login failed (${err.message}). Retrying in ${Math.round(wait / 1000)}s…`);
      await sleep(wait);
    }
  }
}

// A kitchen ticket is worth retrying — the printer is often just momentarily
// busy, asleep, or mid-reconnect, and a dropped ticket means a missed order.
async function printWithRetry(target, buffer, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await sendToPrinter(target, buffer);
      return;
    } catch (err) {
      if (i === attempts) throw err;
      log(`Print attempt ${i}/${attempts} failed (${err.message}); retrying…`);
      await sleep(2000 * i);
    }
  }
}

function markPreparing(orderId) {
  return markOrderPreparing(config.apiUrl, session.token, orderId);
}

async function printOrder(order) {
  const targets = effectivePrinters().filter((t) => {
    if (t.kind === 'network' && !t.ip) {
      log(
        `Skipped ${t.name}: no printer configured. Set "serialPort" (e.g. COM1) ` +
        `for a printer wired to this PC, or a printer IP in config.json or the ` +
        `dashboard's Settings > Kitchen ticket printing.`,
      );
      return false;
    }
    return true;
  });
  if (!targets.length) return;

  // Printers can differ in paper width and buzzer settings, so each gets a
  // ticket built for it rather than one buffer shared between them.
  const ticketFor = (t) =>
    buildTicket({
      beep: t.beep,
      bell: t.bell,
      minLines: t.minLines,
      restaurantName: session.restaurant?.name,
      tableNumber: order.tableNumber,
      items: order.items,
      totalAmount: order.totalAmount,
      currency: session.restaurant?.currency,
      customerNote: order.customerNote,
      orderShortId: order._id?.slice(-6),
      createdAt: order.createdAt,
      takeOut: order.orderType === 'TAKE_OUT',
      width: t.width,
    });

  // In parallel and independently: one printer being out of paper must not
  // cost the kitchen the copy that the other one would have printed.
  const results = await Promise.all(
    targets.map(async (t) => {
      try {
        await printWithRetry(t, ticketFor(t));
        return { t, ok: true };
      } catch (err) {
        log(`FAILED to print order ${order._id} to ${t.describe} - ${err.message}`);
        return { t, ok: false };
      }
    }),
  );

  const printed = results.filter((r) => r.ok);
  if (!printed.length) return;

  log(
    `Printed ticket for table ${order.tableNumber} (order ${order._id}) on ` +
    `${printed.map((r) => r.t.name).join(', ')}` +
    (printed.length < results.length ? ` (${results.length - printed.length} failed)` : ''),
  );

  // One printed copy means the kitchen has the order - advance it to
  // Preparing so the customer sees progress without any staff tap.
  if (order._id && order._id !== 'testprint') {
    markPreparing(order._id).catch((err) =>
      log(`Could not mark order ${order._id} preparing: ${err.message}`),
    );
  }
}

const ORDER_CREATED_SUBSCRIPTION = `
  subscription OrderCreated($restaurantId: ID!) {
    orderCreated(restaurantId: $restaurantId) {
      _id tableNumber totalAmount customerNote createdAt orderType
      items { name quantity price notes }
    }
  }
`;

function startSubscription() {
  const client = createClient({
    url: config.wsUrl,
    webSocketImpl: WebSocket,
    retryAttempts: Infinity,
    connectionParams: () => ({ authorization: `Bearer ${session.token}` }),
    on: {
      connected: () => log('Connected to order stream.'),
      closed: (event) => log(`Order stream closed (code ${event?.code ?? '?'}). Reconnecting…`),
      error: (err) => log(`Order stream error: ${err?.message || err}`),
    },
  });

  client.subscribe(
    { query: ORDER_CREATED_SUBSCRIPTION, variables: { restaurantId: session.restaurantId } },
    {
      next: (result) => {
        const order = result.data?.orderCreated;
        if (order) printOrder(order).catch((err) => log(`Unexpected print error: ${err.message}`));
      },
      error: (err) => log(`Subscription error: ${err?.message || err}`),
      complete: () => log('Subscription completed unexpectedly.'),
    },
  );

  return client;
}

async function main() {
  // Buzzer support varies by firmware, so let the installer hear both
  // dialects rather than burning a ticket's worth of paper per guess.
  if (process.argv.includes('--test-beep')) {
    for (const t of effectivePrinters()) {
      for (const mode of ['escB', 'bel']) {
        log(`Beeping ${t.name} using "${mode}"...`);
        try {
          await sendToPrinter(t, beep(9, 9, mode, 2));
        } catch (err) {
          log(`  failed: ${err.message}`);
          break;
        }
        await sleep(2500);
      }
    }
    log('Done. Whichever one you heard is the "beepMode" to put in config.json.');
    process.exit(0);
  }

  // A bell can be wired to either pin of the drawer connector, and which one
  // is not written on anything - so try both and let the installer listen.
  if (process.argv.includes('--test-bell')) {
    for (const t of effectivePrinters()) {
      for (const pin of [0, 1]) {
        log(`Ringing ${t.name} on drawer pin ${pin === 0 ? 2 : 5}...`);
        try {
          await sendToPrinter(t, drawerKick(pin, 300, 300, 2));
        } catch (err) {
          log(`  failed: ${err.message}`);
          break;
        }
        await sleep(3000);
      }
    }
    log('Done. Whichever pin rang is the pin value for config.json (2 -> 0, 5 -> 1).');
    process.exit(0);
  }

  if (process.argv.includes('--test-print')) {
    await authenticate();
    await printOrder({
      _id: 'testprint',
      tableNumber: 1,
      totalAmount: 12.5,
      customerNote: 'Bu print-agent yuborgan sinov cheki.',
      createdAt: new Date(),
      orderType: 'TAKE_OUT',
      items: [
        { name: 'Sinov taomi', quantity: 2, price: 5, notes: 'piyozsiz' },
        { name: 'Sinov ichimligi', quantity: 1, price: 2.5 },
      ],
    });
    process.exit(0);
  }

  await authenticateWithRetry();
  startSubscription();

  // JWT_EXPIRES_IN defaults to 7d server-side; refresh well before that so
  // the connection never drops due to an expired token.
  setInterval(() => {
    authenticateWithRetry();
  }, 6 * 24 * 60 * 60 * 1000);

  // Re-read printer settings often, so changing the printer IP (or currency,
  // or name) in the dashboard takes effect in minutes rather than waiting for
  // the next re-authentication.
  setInterval(async () => {
    try {
      const fresh = await getMyRestaurant(config.apiUrl, session.token);
      // Serially-wired printers are described entirely by config.json, so for
      // those this comparison simply never fires - only a dashboard IP moves.
      const before = effectivePrinters().map((t) => t.describe).join(' + ');
      session.restaurant = fresh;
      const after = effectivePrinters().map((t) => t.describe).join(' + ');
      if (before !== after) {
        log(`Printer target changed to ${after}.`);
      }
    } catch {
      // Transient API blip — keep the cached config and try again next tick.
    }
  }, 2 * 60 * 1000);

  log('Print agent running. Waiting for new orders…');
}

// Running unattended as a service, a stray rejection must not take the agent
// down for the rest of the day. Log it and keep the process alive; the
// subscription client reconnects on its own.
process.on('unhandledRejection', (err) => {
  log(`Unhandled rejection: ${err?.message || err}`);
});
process.on('uncaughtException', (err) => {
  log(`Uncaught exception: ${err?.message || err}`);
});

main().catch((err) => {
  log(`Fatal startup error: ${err.message}`);
  process.exit(1);
});
