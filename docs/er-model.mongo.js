/**
 * Builds a scratch database that mirrors the Vivora schema, so Moon Modeler
 * (or Compass, or any tool that reverse-engineers MongoDB) can import the
 * structure instead of you typing 10 collections in by hand.
 *
 *   mongosh "mongodb://localhost:27017" --file docs/er-model.mongo.js
 *
 * or against Atlas:
 *
 *   mongosh "<your-atlas-uri>" --file docs/er-model.mongo.js
 *
 * It writes to a database called `vivora_ermodel` and NOTHING ELSE. It drops
 * that database first, so re-running it is safe. It never touches
 * `restaurant-platform`.
 *
 * Each collection gets:
 *   - a $jsonSchema validator (field names, BSON types, required fields)
 *   - the real indexes, including the unique and partial ones
 *   - one sample document, because Moon Modeler infers field types by
 *     sampling documents as well as reading the validator
 *
 * The sample documents deliberately use the types the app ACTUALLY stores:
 * most foreign keys are strings, not ObjectIds. See docs/er-model.md.
 *
 * What this cannot do: relationships. No MongoDB tool records foreign keys,
 * so after importing you still draw the 16 relations yourself - the list is
 * in docs/er-model.md.
 */

const DB = 'vivora_ermodel';
db = db.getSiblingDB(DB);
db.dropDatabase();
print(`building ${DB}\n`);

const oid = () => new ObjectId();
const RESTAURANT_ID = oid().toString(); // stored as a string, as the app does
const CATEGORY_ID = oid().toString();
const USER_ID = oid().toString();
const TABLE_OID = oid();
const SESSION_OID = oid();
const MENU_ITEM_OID = oid();
const now = new Date();

/** createCollection + validator + indexes + one sample doc. */
function collection(name, { required, properties, indexes = [], sample }) {
  db.createCollection(name, {
    validator: {
      $jsonSchema: { bsonType: 'object', required, properties },
    },
    validationLevel: 'moderate',
  });
  indexes.forEach(([keys, opts]) => db[name].createIndex(keys, opts || {}));
  db[name].insertOne(sample);
  print(`  ${name.padEnd(16)} ${Object.keys(properties).length} fields, ` +
    `${indexes.length} indexes`);
}

// ── users ──────────────────────────────────────────────────────────────────
collection('users', {
  required: ['name', 'email', 'password', 'role', 'isActive'],
  properties: {
    name: { bsonType: 'string' },
    email: { bsonType: 'string' },
    password: { bsonType: 'string' },
    role: { enum: ['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'STAFF'] },
    restaurantId: { bsonType: ['string', 'null'] },
    isActive: { bsonType: 'bool' },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: 'date' },
  },
  indexes: [
    [{ email: 1 }, { unique: true }],
    [{ restaurantId: 1 }],
    [{ role: 1 }],
  ],
  sample: {
    name: 'Restoran egasi',
    email: 'owner@example.com',
    password: '$2a$10$hashed',
    role: 'RESTAURANT_ADMIN',
    restaurantId: RESTAURANT_ID,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
});

// ── restaurants ────────────────────────────────────────────────────────────
collection('restaurants', {
  required: ['name', 'slug', 'status'],
  properties: {
    name: { bsonType: 'string' },
    slug: { bsonType: 'string' },
    ownerId: { bsonType: ['string', 'null'] },
    description: { bsonType: 'string' },
    address: { bsonType: 'string' },
    phone: { bsonType: 'string' },
    logo: { bsonType: 'string' },
    coverImage: { bsonType: 'string' },
    currency: { bsonType: 'string' },
    telegramChatId: { bsonType: 'string' },
    printerEnabled: { bsonType: 'bool' },
    printerIp: { bsonType: 'string' },
    printerPort: { bsonType: 'int' },
    openingTime: { bsonType: 'string' },
    closingTime: { bsonType: 'string' },
    alwaysOpen: { bsonType: 'bool' },
    timezone: { bsonType: 'string' },
    isActive: { bsonType: 'bool' },
    status: { enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED'] },
    rejectionReason: { bsonType: 'string' },
    reviewedAt: { bsonType: ['date', 'null'] },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: 'date' },
  },
  indexes: [
    [{ slug: 1 }, { unique: true }],
    [{ ownerId: 1 }],
    [{ isActive: 1, createdAt: -1 }],
    [{ status: 1, createdAt: -1 }],
  ],
  sample: {
    _id: new ObjectId(RESTAURANT_ID),
    name: 'Namuna Restoran',
    slug: 'namuna',
    ownerId: USER_ID,
    description: '',
    address: 'Seoul',
    phone: '+82 10 0000 0000',
    logo: '',
    coverImage: '',
    currency: 'KRW',
    telegramChatId: '',
    printerEnabled: false,
    printerIp: '',
    printerPort: NumberInt(9100),
    openingTime: '09:00',
    closingTime: '22:00',
    alwaysOpen: true,
    timezone: 'Asia/Seoul',
    isActive: true,
    status: 'APPROVED',
    rejectionReason: '',
    reviewedAt: now,
    createdAt: now,
    updatedAt: now,
  },
});

// ── menucategories ─────────────────────────────────────────────────────────
collection('menucategories', {
  required: ['restaurantId', 'name'],
  properties: {
    restaurantId: { bsonType: 'string' },
    name: { bsonType: 'string' },
    translations: { bsonType: 'object' },
    order: { bsonType: 'int' },
    isActive: { bsonType: 'bool' },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: 'date' },
  },
  indexes: [
    [{ restaurantId: 1, order: 1 }],
    [{ restaurantId: 1, isActive: 1 }],
  ],
  sample: {
    _id: new ObjectId(CATEGORY_ID),
    restaurantId: RESTAURANT_ID,
    name: 'Salatlar',
    translations: {
      en: { name: 'Salads' },
      ru: { name: 'Салаты' },
      ko: { name: '샐러드' },
    },
    order: NumberInt(0),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
});

// ── menuitems ──────────────────────────────────────────────────────────────
collection('menuitems', {
  required: ['restaurantId', 'categoryId', 'name', 'price'],
  properties: {
    restaurantId: { bsonType: 'string' },
    categoryId: { bsonType: 'string' },
    name: { bsonType: 'string' },
    description: { bsonType: 'string' },
    translations: { bsonType: 'object' },
    price: { bsonType: ['double', 'int', 'long'], minimum: 0 },
    imageUrl: { bsonType: 'string' },
    images: { bsonType: 'array', items: { bsonType: 'string' } },
    allergens: { bsonType: 'array', items: { bsonType: 'string' } },
    tags: { bsonType: 'array', items: { bsonType: 'string' } },
    isAvailable: { bsonType: 'bool' },
    isPopular: { bsonType: 'bool' },
    trackQuantity: { bsonType: 'bool' },
    quantity: { bsonType: 'int', minimum: 0 },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: 'date' },
  },
  indexes: [
    [{ restaurantId: 1, categoryId: 1 }],
    [{ restaurantId: 1, isAvailable: 1 }],
  ],
  sample: {
    _id: MENU_ITEM_OID,
    restaurantId: RESTAURANT_ID,
    categoryId: CATEGORY_ID,
    name: 'Achchiq-chuchuk',
    description: 'Pomidor va piyoz salati',
    translations: {
      en: { name: 'Tomato salad', description: 'Tomato and onion salad' },
      ru: { name: 'Ачик-чучук', description: 'Салат из помидоров и лука' },
      ko: { name: '토마토 샐러드', description: '토마토와 양파 샐러드' },
    },
    price: 12000,
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/dish.jpg',
    images: ['https://res.cloudinary.com/demo/image/upload/dish.jpg'],
    allergens: [],
    tags: ['vegetarian'],
    isAvailable: true,
    isPopular: false,
    trackQuantity: false,
    quantity: NumberInt(0),
    createdAt: now,
    updatedAt: now,
  },
});

// ── tables ─────────────────────────────────────────────────────────────────
collection('tables', {
  required: ['restaurantId', 'number', 'name'],
  properties: {
    restaurantId: { bsonType: 'string' },
    number: { bsonType: 'int' },
    name: { bsonType: 'string' },
    qrCodeDataUrl: { bsonType: 'string' },
    capacity: { bsonType: 'int' },
    isActive: { bsonType: 'bool' },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: 'date' },
  },
  indexes: [
    [{ restaurantId: 1, number: 1 }, { unique: true }],
    [{ restaurantId: 1, isActive: 1 }],
  ],
  sample: {
    _id: TABLE_OID,
    restaurantId: RESTAURANT_ID,
    number: NumberInt(5),
    name: '5-stol',
    qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgo=',
    capacity: NumberInt(4),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
});

// ── tablesessions ──────────────────────────────────────────────────────────
collection('tablesessions', {
  required: ['restaurantId', 'tableId', 'tableNumber', 'status'],
  properties: {
    restaurantId: { bsonType: 'objectId' },
    tableId: { bsonType: 'objectId' },
    tableNumber: { bsonType: 'int' },
    status: { enum: ['OPEN', 'CLOSED'] },
    totalAmount: { bsonType: ['double', 'int', 'long'], minimum: 0 },
    lastOrderAt: { bsonType: 'date' },
    closedAt: { bsonType: ['date', 'null'] },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: 'date' },
  },
  indexes: [
    [{ restaurantId: 1, status: 1 }],
    [{ restaurantId: 1, tableNumber: 1, status: 1 }],
    // At most one OPEN tab per table.
    [{ tableId: 1 }, {
      unique: true,
      partialFilterExpression: { status: 'OPEN' },
    }],
  ],
  sample: {
    _id: SESSION_OID,
    restaurantId: new ObjectId(RESTAURANT_ID),
    tableId: TABLE_OID,
    tableNumber: NumberInt(5),
    status: 'OPEN',
    totalAmount: 24000,
    lastOrderAt: now,
    closedAt: null,
    createdAt: now,
    updatedAt: now,
  },
});

// ── orders ─────────────────────────────────────────────────────────────────
collection('orders', {
  required: ['restaurantId', 'items', 'status', 'orderType', 'totalAmount'],
  properties: {
    restaurantId: { bsonType: 'string' },
    tableId: { bsonType: ['objectId', 'null'] },
    sessionId: { bsonType: ['objectId', 'null'] },
    tableNumber: { bsonType: ['int', 'null'] },
    items: {
      bsonType: 'array',
      items: {
        bsonType: 'object',
        required: ['menuItemId', 'name', 'price', 'quantity'],
        properties: {
          menuItemId: { bsonType: 'objectId' },
          name: { bsonType: 'string' },
          price: { bsonType: ['double', 'int', 'long'] },
          quantity: { bsonType: 'int' },
          notes: { bsonType: 'string' },
        },
      },
    },
    status: {
      enum: ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'],
    },
    orderType: { enum: ['DINE_IN', 'TAKE_OUT'] },
    totalAmount: { bsonType: ['double', 'int', 'long'], minimum: 0 },
    customerNote: { bsonType: 'string' },
    language: { bsonType: 'string' },
    customerName: { bsonType: 'string' },
    customerPhone: { bsonType: 'string' },
    scheduledFor: { bsonType: ['date', 'null'] },
    isPaid: { bsonType: 'bool' },
    paidAt: { bsonType: ['date', 'null'] },
    servedAt: { bsonType: ['date', 'null'] },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: 'date' },
  },
  indexes: [
    [{ restaurantId: 1, status: 1 }],
    [{ restaurantId: 1, isPaid: 1, createdAt: -1 }],
    [{ restaurantId: 1, createdAt: -1 }],
    [{ tableId: 1, createdAt: -1 }],
    [{ sessionId: 1 }],
  ],
  sample: {
    restaurantId: RESTAURANT_ID,
    tableId: TABLE_OID,
    sessionId: SESSION_OID,
    tableNumber: NumberInt(5),
    items: [{
      menuItemId: MENU_ITEM_OID,
      name: 'Achchiq-chuchuk',
      price: 12000,
      quantity: NumberInt(2),
      notes: 'Piyozsiz',
    }],
    status: 'PENDING',
    orderType: 'DINE_IN',
    totalAmount: 24000,
    customerNote: '',
    language: 'uz',
    customerName: '',
    customerPhone: '',
    scheduledFor: null,
    isPaid: false,
    paidAt: null,
    servedAt: null,
    createdAt: now,
    updatedAt: now,
  },
});

// ── feedbacks ──────────────────────────────────────────────────────────────
collection('feedbacks', {
  required: ['restaurantId', 'rating'],
  properties: {
    restaurantId: { bsonType: 'string' },
    orderId: { bsonType: ['objectId', 'null'] },
    rating: { bsonType: 'int', minimum: 1, maximum: 5 },
    comment: { bsonType: 'string' },
    language: { bsonType: 'string' },
    tableNumber: { bsonType: 'int' },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: 'date' },
  },
  indexes: [[{ restaurantId: 1, createdAt: -1 }]],
  sample: {
    restaurantId: RESTAURANT_ID,
    orderId: null,
    rating: NumberInt(5),
    comment: 'Juda mazali edi',
    language: 'uz',
    tableNumber: NumberInt(5),
    createdAt: now,
    updatedAt: now,
  },
});

// ── billinginvoices ────────────────────────────────────────────────────────
collection('billinginvoices', {
  required: ['restaurantId', 'period', 'revenue', 'feeRate', 'amountDue'],
  properties: {
    restaurantId: { bsonType: 'string' },
    period: { bsonType: 'string' },
    revenue: { bsonType: ['double', 'int', 'long'], minimum: 0 },
    feeRate: { bsonType: ['double', 'int', 'long'] },
    amountDue: { bsonType: ['double', 'int', 'long'], minimum: 0 },
    currency: { bsonType: 'string' },
    status: { enum: ['PENDING', 'AWAITING_REVIEW', 'PAID'] },
    paidReportedAt: { bsonType: ['date', 'null'] },
    confirmedAt: { bsonType: ['date', 'null'] },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: 'date' },
  },
  indexes: [
    [{ restaurantId: 1, period: 1 }, { unique: true }],
    [{ period: 1, status: 1 }],
  ],
  sample: {
    restaurantId: RESTAURANT_ID,
    period: '2026-07',
    revenue: 10000000,
    feeRate: 0.003,
    amountDue: 30000,
    currency: 'KRW',
    status: 'PENDING',
    paidReportedAt: null,
    confirmedAt: null,
    createdAt: now,
    updatedAt: now,
  },
});

// ── errorlogs ──────────────────────────────────────────────────────────────
collection('errorlogs', {
  required: ['level', 'message'],
  properties: {
    restaurantId: { bsonType: ['objectId', 'null'] },
    level: { enum: ['ERROR', 'WARN', 'INFO'] },
    message: { bsonType: 'string' },
    stack: { bsonType: 'string' },
    context: { bsonType: 'string' },
    meta: { bsonType: 'object' },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: 'date' },
  },
  indexes: [
    [{ createdAt: -1 }],
    [{ restaurantId: 1, createdAt: -1 }],
  ],
  sample: {
    restaurantId: new ObjectId(RESTAURANT_ID),
    level: 'ERROR',
    message: 'Translation request failed',
    stack: 'Error: timeout\n    at translate()',
    context: 'MenuService.translate',
    meta: { itemId: MENU_ITEM_OID.toString() },
    createdAt: now,
    updatedAt: now,
  },
});

print(`\ndone. ${db.getCollectionNames().length} collections in ${DB}.`);
print('Point Moon Modeler at this database and reverse-engineer it,');
print('then draw the 16 relations listed in docs/er-model.md.');
