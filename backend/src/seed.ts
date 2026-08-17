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
import { AuthService } from './components/auth/auth.service';
import { UsersService } from './components/users/users.service';
import { RestaurantsService } from './components/restaurants/restaurants.service';
import { MenuService } from './components/menu/menu.service';
import { TablesService } from './components/tables/tables.service';
import { OrdersService } from './components/orders/orders.service';
import { FeedbackService } from './components/feedback/feedback.service';
import { OrderStatus } from './libs/enums/order.enum';

const log = new Logger('Seed');

// The demo doubles as the sales pitch: an owner being shown Vivora should
// recognise their own restaurant in it, so this is a specific Uzbek place in
// Korea priced in won, not a generic bistro in dollars.
const DEMO = {
  admin: { name: 'Bekzod Rahimov', email: 'demo@bistro.com', password: 'demo12345', restaurantName: 'Registon' },
  staff: { name: 'Oshpaz Aziz', email: 'chef@bistro.com', password: 'chef12345' },
};

// img: verified free-licence Unsplash photos (rendered via <img>, no
// next/image). Deliberately not plus.unsplash.com - those are Unsplash+ and
// need a paid licence.
const U = (p: string) =>
  `https://images.unsplash.com/${p}?w=600&q=80&auto=format&fit=crop`;

// Prices in won, at roughly what a modest Uzbek restaurant in Korea charges.
const CATEGORIES: {
  name: string;
  items: { name: string; description: string; price: number; popular?: boolean; track?: number; img?: string }[];
}[] = [
  {
    name: 'Salatlar va nonushta',
    items: [
      { name: 'Achichuk', description: "Pomidor, piyoz, ko'k rayhon, zaytun moyi", price: 5000, img: U('photo-1615802546508-f992bc087b9c') },
      { name: 'Somsa', description: "Tandir somsa, qo'y go'shti va piyoz bilan", price: 4000, popular: true, track: 40, img: U('photo-1572099107898-46f22b3af4f9') },
      { name: 'Tandir non', description: 'Har kuni ertalab tandirda yopiladi', price: 2000, track: 60, img: U('photo-1783669869678-71f0770dd48b') },
    ],
  },
  {
    name: "Sho'rvalar",
    items: [
      { name: "Lag'mon", description: "Qo'lda tortilgan ugra, mol go'shti, sabzavot", price: 11000, popular: true, img: U('photo-1731460202531-bf8389d565f7') },
      { name: 'Mastava', description: 'Guruchli shorva, qatiq va koʻk bilan', price: 10000, img: U('photo-1766375888258-da3f1638009c') },
      { name: "Sho'rva", description: "Qo'y go'shti, kartoshka, sabzi, no'xat", price: 10000, img: U('photo-1597345637412-9fd611e758f3') },
    ],
  },
  {
    name: 'Asosiy taomlar',
    items: [
      { name: 'Osh', description: "Devzira guruch, qo'y go'shti, sariq sabzi, zira", price: 12000, popular: true, img: U('photo-1634324092526-91f5e878b72f') },
      { name: 'Manti', description: "Bug'da pishirilgan, qo'y go'shti va piyoz", price: 12000, popular: true, img: U('photo-1523905330026-b8bd1f5f320e') },
      { name: 'Chuchvara', description: 'Kichik chuchvara, qatiq yoki shorvada', price: 10000, img: U('photo-1708782341487-6544f0d9efe8') },
      { name: "Qovurma lag'mon", description: 'Qovurilgan ugra, achchiq qalampir bilan', price: 12000, track: 25, img: U('photo-1565628308934-c731959645f2') },
    ],
  },
  {
    name: 'Kaboblar',
    items: [
      { name: "Qo'y kabob", description: "Bir sixda, ko'mirda pishiriladi", price: 5000, popular: true, img: U('photo-1676300184761-92585b329535') },
      { name: 'Tovuq kabob', description: 'Bir sixda, ziravorlarda saqlangan', price: 4500, img: U('photo-1555939594-58d7cb561ad1') },
      { name: 'Lula kabob', description: "Qiyma go'sht, piyoz va ko'k", price: 5000, track: 30, img: U('photo-1603360946369-dc9bb6258143') },
    ],
  },
  {
    name: 'Ichimliklar',
    items: [
      { name: "Ko'k choy", description: 'Choynakda, ikki kishiga', price: 2000, img: U('photo-1654169614907-01f893a226d5') },
      { name: 'Qora choy', description: 'Choynakda, limon bilan', price: 2000, img: U('photo-1627828094935-5a73a17affd0') },
      { name: 'Ayron', description: 'Uyda tayyorlangan, sovuq', price: 3000, img: U('photo-1558113583-d75f23fcb8a9') },
      { name: 'Kompot', description: 'Mevali, shakari kam', price: 3000, img: U('photo-1608753478723-494e2dc286f2') },
    ],
  },
  {
    name: 'Shirinliklar',
    items: [
      { name: 'Chak-chak', description: 'Asal bilan, choyga juda mos', price: 5000, popular: true, track: 20, img: U('photo-1778448806228-36ce0660a8ef') },
      { name: "Bog'irsoq", description: 'Yangi pishirilgan, qand sepilgan', price: 4500, img: U('photo-1778448806484-b33d73ea519c') },
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
    description:
      "Samarqand va Toshkent taomlari. Osh o'tinda damlanadi, non har kuni " +
      'ertalab tandirda yopiladi.',
    address: 'Gyeonggi-do, Ansan-si, Danwon-gu, Wongok-bon-dong 128',
    phone: '+82 31 495 0142',
    currency: 'KRW',
    coverImage:
      'https://images.unsplash.com/photo-1763951718950-c536b1295213?w=1600&q=80&auto=format&fit=crop',
    // Left always-open on purpose. Real hours would demo the feature, but a
    // demo that refuses orders because it is 23:00 is worse than useless when
    // you are sitting in front of a restaurant owner.
    alwaysOpen: true,
    openingTime: '10:00',
    closingTime: '23:00',
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
  // A real dining room is not eight identical tables: a couple of small ones
  // by the window, family tables in the middle, and one big one for a party.
  const tableSpecs = [
    { number: 1, name: '1-stol', capacity: 2 },
    { number: 2, name: '2-stol', capacity: 2 },
    { number: 3, name: '3-stol', capacity: 4 },
    { number: 4, name: '4-stol', capacity: 4 },
    { number: 5, name: '5-stol', capacity: 4 },
    { number: 6, name: '6-stol', capacity: 6 },
    { number: 7, name: '7-stol', capacity: 6 },
    { number: 8, name: 'Katta xona', capacity: 12 },
  ];
  const tableNumbers = tableSpecs.map((t) => t.number);
  for (const t of tableSpecs) {
    await tables.create(rid, slug, t, frontendUrl);
  }
  log.log(`${tableNumbers.length} tables created with QR codes`);

  // --- 5. Orders across statuses (populates kitchen, orders, analytics) ---
  const mk = (name: string, qty: number) => ({ menuItemId: itemsByName[name], quantity: qty });
  const orderSpecs: { table: number; items: { menuItemId: string; quantity: number }[]; note?: string; status: OrderStatus }[] = [
    { table: 1, items: [mk('Osh', 2), mk("Ko'k choy", 1), mk('Tandir non', 2)], note: 'Zira kam solinsin', status: OrderStatus.SERVED },
    { table: 3, items: [mk("Lag'mon", 2), mk('Achichuk', 1), mk('Ayron', 2)], status: OrderStatus.SERVED },
    { table: 8, items: [mk("Qo'y kabob", 8), mk('Tandir non', 4), mk('Achichuk', 2), mk("Ko'k choy", 3)], note: "To'y, 12 kishi", status: OrderStatus.SERVED },
    { table: 2, items: [mk('Manti', 1), mk('Qora choy', 1)], status: OrderStatus.READY },
    { table: 4, items: [mk('Somsa', 4), mk("Ko'k choy", 2)], status: OrderStatus.PREPARING },
    { table: 5, items: [mk('Chuchvara', 2), mk('Kompot', 2), mk('Chak-chak', 1)], note: 'Bolalar uchun, achchiq bomasin', status: OrderStatus.PREPARING },
    { table: 6, items: [mk("Qovurma lag'mon", 2), mk('Ayron', 2)], status: OrderStatus.PENDING },
    { table: 7, items: [mk("Sho'rva", 2), mk('Tandir non', 1), mk('Qora choy', 1)], status: OrderStatus.PENDING },
    { table: 2, items: [mk('Mastava', 1), mk('Lula kabob', 2)], status: OrderStatus.SERVED },
    { table: 1, items: [mk('Chak-chak', 2), mk('Qora choy', 2)], status: OrderStatus.PENDING },
  ];

  const placedIds: string[] = [];
  for (const spec of orderSpecs) {
    const order = await orders.placeOrder({
      restaurantId: rid,
      tableNumber: spec.table,
      items: spec.items,
      customerNote: spec.note || '',
      language: 'uz',
    } as any);
    placedIds.push(order._id.toString());
    if (spec.status !== OrderStatus.PENDING) {
      await orders.updateStatus(rid, { orderId: order._id.toString(), status: spec.status } as any);
    }
  }
  log.log(`${orderSpecs.length} orders placed across PENDING/PREPARING/READY/SERVED`);

  // --- 6. Feedback ---
  // Not five-star across the board: a demo with one honest complaint in it
  // reads as real, and it shows an owner what the feedback page is actually
  // for.
  const reviews = [
    { rating: 5, comment: "Oshi zo'r, uydagidek. Rahmat!", table: 1, lang: 'uz' },
    { rating: 5, comment: "Lag'mon juda mazali, ugrasi qo'lda tortilgan.", table: 3, lang: 'uz' },
    { rating: 4, comment: 'Somsa issiq va yangi edi, biroz kutdik.', table: 4, lang: 'uz' },
    { rating: 5, comment: '양고기 꼬치가 정말 맛있어요. 다시 올게요.', table: 8, lang: 'ko' },
    { rating: 3, comment: 'Taomlar yaxshi, lekin ichkarida issiq edi.', table: 5, lang: 'uz' },
    { rating: 5, comment: 'Очень вкусный плов, как дома.', table: 2, lang: 'ru' },
    { rating: 4, comment: 'QR orqali buyurtma berish juda qulay ekan.', table: 6, lang: 'uz' },
  ];
  for (const r of reviews) {
    await feedback.submit({ restaurantId: rid, rating: r.rating, comment: r.comment, language: r.lang, tableNumber: r.table } as any);
  }
  log.log(`${reviews.length} feedback entries added`);

  // --- Summary ---
  /* eslint-disable no-console */
  console.log('\n========================================');
  console.log('  ✅ DEMO SEED COMPLETE');
  console.log('========================================');
  console.log('  Restaurant admin:  demo@bistro.com / demo12345');
  console.log('  Kitchen staff:     chef@bistro.com / chef12345');
  console.log('  Super admin:       see SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD in .env');
  console.log('');
  // Whatever FRONTEND_URL was set to is what the QR codes now point at, so
  // print that rather than localhost - it is the only way to notice that a
  // production seed was run with a development URL baked into every code.
  console.log(`  Dashboard:     ${frontendUrl}/dashboard`);
  console.log(`  Kitchen:       ${frontendUrl}/kitchen`);
  console.log(`  Restaurant:    ${frontendUrl}/${slug}`);
  console.log(`  Customer menu: ${frontendUrl}/${slug}/1`);
  console.log(`  QR codes point at ${frontendUrl}`);
  console.log('========================================\n');

  // Menu translation is fire-and-forget, so exiting here kills whatever is
  // still in flight - which is why a fresh seed used to come out mostly
  // untranslated. Run the backfill until it has nothing left to do rather
  // than sleeping and hoping.
  for (let pass = 0; pass < 12; pass++) {
    const before = await menu.countUntranslated();
    if (!before) break;
    if (pass === 0) log.log(`Translating ${before} menu row(s) before exit...`);
    await menu.backfillMissingTranslations();
    if ((await menu.countUntranslated()) === before) break; // making no progress
  }
  const left = await menu.countUntranslated();
  log.log(left ? `${left} menu row(s) still untranslated` : 'All menu rows translated');

  await app.close();
  process.exit(0);
}

run().catch((err) => {
  log.error(err.message, err.stack);
  process.exit(1);
});
