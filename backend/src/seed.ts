/**
 * Full demo seed. Idempotent: wipes the demo restaurant's data and recreates it.
 * Reuses the real services so password hashing, slug + QR generation, and stock
 * logic all run exactly as in production.
 *
 *   npm run seed      (builds, then runs node dist/seed.js)
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { RestaurantsService } from './restaurants/restaurants.service';
import { MenuService } from './menu/menu.service';
import { TablesService } from './tables/tables.service';
import { OrdersService } from './orders/orders.service';
import { FeedbackService } from './feedback/feedback.service';
import { OrderStatus } from './common/enums';

const log = new Logger('Seed');

const DEMO = {
  admin: { name: 'Demo Owner', email: 'demo@bistro.com', password: 'demo12345', restaurantName: 'Demo Bistro' },
  staff: { name: 'Demo Chef', email: 'chef@bistro.com', password: 'chef12345' },
};

// img: a few Unsplash photos for a nicer demo (rendered via <img>, no next/image)
const CATEGORIES: {
  name: string;
  items: { name: string; description: string; price: number; popular?: boolean; track?: number; img?: string }[];
}[] = [
  {
    name: 'Starters',
    items: [
      { name: 'Garlic Bread', description: 'Toasted ciabatta, roasted garlic butter, parsley', price: 4.5, img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=600&q=80&auto=format&fit=crop' },
      { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons, classic dressing', price: 7.0, popular: true, img: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80&auto=format&fit=crop' },
      { name: 'Soup of the Day', description: 'Ask your server - made fresh daily', price: 5.5, track: 15, img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80&auto=format&fit=crop' },
    ],
  },
  {
    name: 'Burgers',
    items: [
      { name: 'Classic Beef Burger', description: 'Grass-fed beef, cheddar, lettuce, tomato', price: 9.5, popular: true, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80&auto=format&fit=crop' },
      { name: 'Crispy Chicken Burger', description: 'Buttermilk-fried chicken, slaw, spicy mayo', price: 9.0, img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80&auto=format&fit=crop' },
      { name: 'Veggie Burger', description: 'Black bean patty, avocado, pickled onion', price: 8.5, track: 10, img: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&q=80&auto=format&fit=crop' },
    ],
  },
  {
    name: 'Pizza',
    items: [
      { name: 'Margherita', description: 'San Marzano tomato, mozzarella, basil', price: 11.0, popular: true, img: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&q=80&auto=format&fit=crop' },
      { name: 'Pepperoni', description: 'Double pepperoni, mozzarella, oregano', price: 12.5, img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80&auto=format&fit=crop' },
      { name: 'Funghi', description: 'Wild mushrooms, truffle oil, fontina', price: 13.0, track: 8, img: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&q=80&auto=format&fit=crop' },
    ],
  },
  {
    name: 'Drinks',
    items: [
      { name: 'Fresh Lemonade', description: 'House-made, lightly sweetened', price: 3.5, img: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=600&q=80&auto=format&fit=crop' },
      { name: 'Cola', description: 'Chilled, 330ml', price: 2.5, img: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=80&auto=format&fit=crop' },
      { name: 'Espresso', description: 'Double shot, single-origin', price: 2.0, img: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&q=80&auto=format&fit=crop' },
    ],
  },
  {
    name: 'Desserts',
    items: [
      { name: 'Chocolate Lava Cake', description: 'Warm molten center, vanilla ice cream', price: 6.5, popular: true, track: 12, img: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&q=80&auto=format&fit=crop' },
      { name: 'Cheesecake', description: 'New York style, berry compote', price: 6.0, img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&q=80&auto=format&fit=crop' },
    ],
  },
];

async function run() {
  // Use create() (not createApplicationContext) so the GraphQL/Apollo driver has
  // an HTTP adapter to initialize against — we just never call listen().
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  await app.init();

  const users = app.get(UsersService);
  const auth = app.get(AuthService);
  const restaurants = app.get(RestaurantsService);
  const menu = app.get(MenuService);
  const tables = app.get(TablesService);
  const orders = app.get(OrdersService);
  const feedback = app.get(FeedbackService);

  // --- 1. Clean any previous demo data (idempotent) ---
  const existing = await users.findByEmail(DEMO.admin.email);
  if (existing?.restaurantId) {
    const rid = existing.restaurantId.toString();
    for (const name of ['Order', 'Table', 'MenuItem', 'MenuCategory', 'Feedback']) {
      await app.get(getModelToken(name)).deleteMany({ restaurantId: rid });
    }
    await app.get(getModelToken('User')).deleteMany({ restaurantId: rid });
    await app.get(getModelToken('Restaurant')).deleteOne({ _id: rid });
    log.log('Cleared previous demo data');
  }

  // --- 2. Restaurant + admin + staff ---
  const { user: admin } = await auth.register(DEMO.admin);
  const rid = admin.restaurantId.toString();
  await restaurants.update(rid, {
    description: 'A cozy neighbourhood bistro serving comfort classics.',
    address: '12 Market Street',
    phone: '+1-555-0142',
    currency: 'USD',
  });
  await auth.addStaff(DEMO.staff, admin);
  // Demo restaurant is pre-approved so the customer flow works out of the box.
  await restaurants.approve(rid);
  const restaurant = await restaurants.findById(rid);
  const slug = restaurant!.slug;
  log.log(`Restaurant "${restaurant!.name}" created + approved (slug: ${slug})`);

  // --- 3. Menu ---
  const itemsByName: Record<string, string> = {};
  for (let c = 0; c < CATEGORIES.length; c++) {
    const cat = CATEGORIES[c];
    const category = await menu.createCategory(rid, { name: cat.name, order: c });
    for (const it of cat.items) {
      const created = await menu.createItem(rid, {
        categoryId: category._id.toString(),
        name: it.name,
        description: it.description,
        price: it.price,
        imageUrl: it.img || '',
        isPopular: !!it.popular,
        trackQuantity: it.track !== undefined,
        quantity: it.track ?? 0,
      } as any);
      itemsByName[it.name] = created._id.toString();
    }
  }
  log.log(`Menu created: ${CATEGORIES.length} categories, ${Object.keys(itemsByName).length} items`);

  // --- 4. Tables (+ QR codes) ---
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const tableNumbers = [1, 2, 3, 4, 5, 6];
  for (const n of tableNumbers) {
    await tables.create(rid, slug, { number: n, name: `Table ${n}`, capacity: n <= 2 ? 2 : 4 }, frontendUrl);
  }
  log.log(`${tableNumbers.length} tables created with QR codes`);

  // --- 5. Orders across statuses (populates kitchen, orders, analytics) ---
  const mk = (name: string, qty: number) => ({ menuItemId: itemsByName[name], quantity: qty });
  const orderSpecs: { table: number; items: { menuItemId: string; quantity: number }[]; note?: string; status: OrderStatus }[] = [
    { table: 1, items: [mk('Classic Beef Burger', 2), mk('Fresh Lemonade', 2)], note: 'No onions please', status: OrderStatus.SERVED },
    { table: 2, items: [mk('Margherita', 1), mk('Caesar Salad', 1), mk('Cola', 2)], status: OrderStatus.SERVED },
    { table: 3, items: [mk('Pepperoni', 1), mk('Garlic Bread', 1)], status: OrderStatus.READY },
    { table: 4, items: [mk('Crispy Chicken Burger', 1), mk('Chocolate Lava Cake', 1)], note: 'Birthday — candle if possible', status: OrderStatus.PREPARING },
    { table: 5, items: [mk('Veggie Burger', 1), mk('Espresso', 1)], status: OrderStatus.PREPARING },
    { table: 1, items: [mk('Cheesecake', 2), mk('Espresso', 2)], status: OrderStatus.PENDING },
    { table: 6, items: [mk('Funghi', 1), mk('Fresh Lemonade', 1)], status: OrderStatus.PENDING },
    { table: 2, items: [mk('Soup of the Day', 1), mk('Garlic Bread', 1)], status: OrderStatus.SERVED },
  ];

  const placedIds: string[] = [];
  for (const spec of orderSpecs) {
    const order = await orders.placeOrder({
      restaurantId: rid,
      tableNumber: spec.table,
      items: spec.items,
      customerNote: spec.note || '',
      language: 'en',
    } as any);
    placedIds.push(order._id.toString());
    if (spec.status !== OrderStatus.PENDING) {
      await orders.updateStatus(rid, { orderId: order._id.toString(), status: spec.status } as any);
    }
  }
  log.log(`${orderSpecs.length} orders placed across PENDING/PREPARING/READY/SERVED`);

  // --- 6. Feedback ---
  const reviews = [
    { rating: 5, comment: 'Best burger in town!', table: 1 },
    { rating: 4, comment: 'Great pizza, a bit of a wait.', table: 2 },
    { rating: 5, comment: 'Lovely atmosphere and friendly staff.', table: 3 },
    { rating: 3, comment: 'Food was good, music too loud.', table: 4 },
    { rating: 5, comment: 'The lava cake is incredible.', table: 1 },
  ];
  for (const r of reviews) {
    await feedback.submit({ restaurantId: rid, rating: r.rating, comment: r.comment, language: 'en', tableNumber: r.table } as any);
  }
  log.log(`${reviews.length} feedback entries added`);

  // --- Summary ---
  /* eslint-disable no-console */
  console.log('\n========================================');
  console.log('  ✅ DEMO SEED COMPLETE');
  console.log('========================================');
  console.log('  Restaurant admin:  demo@bistro.com / demo12345');
  console.log('  Kitchen staff:     chef@bistro.com / chef12345');
  console.log('  Super admin:       admin@platform.com / Admin@123456');
  console.log('');
  console.log(`  Dashboard:   http://localhost:3000/dashboard`);
  console.log(`  Kitchen:     http://localhost:3000/kitchen`);
  console.log(`  Customer menu: http://localhost:3000/${slug}/1`);
  console.log('========================================\n');

  await app.close();
  process.exit(0);
}

run().catch((err) => {
  log.error(err.message, err.stack);
  process.exit(1);
});
