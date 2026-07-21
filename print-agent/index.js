'use strict';

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { createClient } = require('graphql-ws');
const { login, getMyRestaurant } = require('./graphql');
const { buildTicket } = require('./escpos');
const { printToNetwork } = require('./printer');

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

function effectivePrinter() {
  const ip = config.printerIp || session.restaurant?.printerIp;
  const port = config.printerIp
    ? (config.printerPort || 9100)
    : (session.restaurant?.printerPort || 9100);
  return { ip, port };
}

async function printOrder(order) {
  const { ip, port } = effectivePrinter();
  if (!ip) {
    log(
      `Skipped printing order ${order._id}: no printer IP configured. ` +
      `Set one in config.json or in the dashboard's Settings > Kitchen ticket printing.`,
    );
    return;
  }

  const buffer = buildTicket({
    restaurantName: session.restaurant?.name,
    tableNumber: order.tableNumber,
    items: order.items,
    totalAmount: order.totalAmount,
    currency: session.restaurant?.currency,
    customerNote: order.customerNote,
    orderShortId: order._id?.slice(-6),
    createdAt: order.createdAt,
    width: config.paperWidth || 48,
  });

  try {
    await printToNetwork(ip, port, buffer);
    log(`Printed ticket for table ${order.tableNumber} (order ${order._id}).`);
  } catch (err) {
    log(`FAILED to print order ${order._id} to ${ip}:${port} — ${err.message}`);
  }
}

const ORDER_CREATED_SUBSCRIPTION = `
  subscription OrderCreated($restaurantId: ID!) {
    orderCreated(restaurantId: $restaurantId) {
      _id tableNumber totalAmount customerNote createdAt
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
  if (process.argv.includes('--test-print')) {
    await authenticate();
    await printOrder({
      _id: 'testprint',
      tableNumber: 1,
      totalAmount: 12.5,
      customerNote: 'This is a test ticket from the print agent.',
      createdAt: new Date(),
      items: [
        { name: 'Test Item', quantity: 2, price: 5, notes: 'no onions' },
        { name: 'Sample Drink', quantity: 1, price: 2.5 },
      ],
    });
    process.exit(0);
  }

  await authenticate();
  startSubscription();

  // JWT_EXPIRES_IN defaults to 7d server-side; refresh well before that so
  // the connection never drops due to an expired token.
  setInterval(() => {
    authenticate().catch((err) => log(`Re-authentication failed: ${err.message}`));
  }, 6 * 24 * 60 * 60 * 1000);

  log('Print agent running. Waiting for new orders…');
}

main().catch((err) => {
  log(`Fatal startup error: ${err.message}`);
  process.exit(1);
});
