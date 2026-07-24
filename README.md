# 🍽 Vivora — Restaurant Management System

Full-stack restaurant management platform with QR menus, real-time kitchen display, and analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS · GraphQL (code-first) · MongoDB/Mongoose |
| Real-time | GraphQL Subscriptions (graphql-ws WebSocket) |
| Frontend | Next.js (Pages Router) · MUI v5 · Apollo Client |
| Auth | JWT (stateless) |
| QR Codes | `qrcode` library (PNG data URLs) |
| Language | English (multi-language planned via Google Translate) |

---

## Project Structure

```
restaurant-platform/
├── backend/               # NestJS API
│   └── src/
│       ├── auth/          # JWT auth, register, login
│       ├── users/         # User management + super admin seed
│       ├── restaurants/   # Restaurant CRUD, slug generation
│       ├── menu/          # Categories + items (i18n fields)
│       ├── tables/        # Tables + QR code generation
│       ├── orders/        # Order lifecycle + subscriptions
│       ├── analytics/     # MongoDB aggregation pipelines
│       ├── feedback/      # Customer reviews
│       ├── error-logs/    # Platform error tracking
│       ├── admin/         # Super admin overview
│       └── pubsub/        # Global PubSub module
│
└── frontend/              # Next.js application
    └── src/
        ├── pages/
        │   ├── index.tsx            # Landing page
        │   ├── login.tsx            # Sign in
        │   ├── register.tsx         # Restaurant registration
        │   ├── dashboard/           # Restaurant admin dashboard
        │   │   ├── index.tsx        # Overview & KPIs
        │   │   ├── menu.tsx         # Menu management (i18n)
        │   │   ├── tables.tsx       # Tables & QR codes
        │   │   ├── orders.tsx       # Order management
        │   │   ├── analytics.tsx    # Revenue & trends
        │   │   ├── feedback.tsx     # Customer reviews
        │   │   └── settings.tsx     # Restaurant settings
        │   ├── kitchen.tsx          # Live kitchen display (dark)
        │   ├── menu/[slug]/[tableNumber].tsx  # Public customer menu
        │   └── admin/index.tsx      # Super admin panel
        ├── components/
        │   └── dashboard/DashboardLayout.tsx
        ├── graphql/operations.ts    # All GQL queries/mutations/subs
        ├── lib/apollo-client.ts     # Apollo + WebSocket setup
        ├── store/auth.store.ts      # Zustand auth store
        ├── theme/index.ts           # MUI custom theme
        └── types/index.ts           # Shared TypeScript types
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB 7+ (or Docker)

### 1. Clone and install

```bash
# Backend
cd backend
cp .env.example .env     # Fill in your values
npm install

# Frontend
cd frontend
cp .env.local.example .env.local
npm install
```

### 2. Start MongoDB

```bash
# With Docker:
docker run -d -p 27017:27017 --name mongo mongo:7
# Or use Docker Compose:
docker-compose up mongodb
```

### 3. Start development servers

```bash
# Backend (port 4000)
cd backend && npm run start:dev

# Frontend (port 3000)
cd frontend && npm run dev
```

### 4. Or use Docker Compose

```bash
docker-compose up --build
```

---

## Key URLs

| URL | Description |
|-----|------------|
| `http://localhost:3000` | Landing page |
| `http://localhost:3000/register` | Create restaurant account |
| `http://localhost:3000/login` | Sign in |
| `http://localhost:3000/dashboard` | Restaurant admin dashboard |
| `http://localhost:3000/kitchen` | Kitchen display (real-time) |
| `http://localhost:3000/menu/[slug]/[table]` | Customer QR menu |
| `http://localhost:3000/admin` | Super admin panel |
| `http://localhost:4000/graphql` | GraphQL playground |

---

## User Roles

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Platform admin — all restaurants, logs, stats |
| `RESTAURANT_ADMIN` | Full dashboard, menu, tables, analytics |
| `STAFF` | Kitchen display, order status updates |
| *(public)* | Customer menu, place orders, feedback |

### Default Super Admin
Created automatically on first server start:
```
Email:    admin@platform.com  (see .env SUPER_ADMIN_EMAIL)
Password: Admin@123456        (see .env SUPER_ADMIN_PASSWORD)
```

---

## GraphQL Subscriptions

The kitchen display uses WebSocket subscriptions:

```graphql
subscription OrderCreated($restaurantId: ID!) {
  orderCreated(restaurantId: $restaurantId) {
    _id tableNumber status totalAmount items { ... }
  }
}

subscription OrderStatusUpdated($restaurantId: ID!) {
  orderStatusUpdated(restaurantId: $restaurantId) {
    _id status updatedAt
  }
}
```

---

## Menu Content

Menu item and category names/descriptions are plain English strings — admins enter them once:

```json
{
  "name": "Beef Burger",
  "description": "Juicy grass-fed beef patty with cheddar"
}
```

> **Roadmap:** multi-language support (EN · UZ · RU · KO) will be re-introduced via automatic Google Translate, so content is still entered once in English and translations are generated automatically rather than typed by hand.

---

## QR Code Flow

1. Admin creates table → backend generates QR code PNG (base64 data URL)
2. QR encodes URL: `https://yourdomain.com/menu/[restaurant-slug]/[table-number]`
3. Admin downloads PNG from dashboard to print/laminate
4. Customer scans → opens mobile-optimized menu page
5. Customer orders → order appears instantly on kitchen display
