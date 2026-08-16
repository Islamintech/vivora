# Deploying Vivora

Three pieces ship separately:

| Piece | What it is | Where it runs |
|---|---|---|
| `backend/` | NestJS + GraphQL API, WebSocket subscriptions, cron jobs | A container host (Railway / Render / Fly) |
| `frontend/` | Next.js site: marketing, dashboard, kitchen, customer menu | Vercel (or the same container host) |
| `print-agent/` | Bridges cloud orders to a local ESC/POS printer | The restaurant's own PC - not deployed by you |

MongoDB stays on Atlas. Don't move it to your host's database add-on: Atlas
already has backups and a free tier, and moving it gains nothing.

---

## Why this split

The backend holds **long-lived WebSocket connections** (the kitchen screen
subscribes to new orders) and runs **cron jobs** (auto-serve, monthly
invoices). Both need a process that stays alive, which rules out serverless
platforms for the API.

The frontend is a normal Next.js app, so Vercel is the best home for it: free
tier, global CDN, preview deploys. Putting it on the same container host also
works and is one less account to manage.

---

## 1. Backend

Deploy from the repo with `backend/` as the root directory. A `Dockerfile` is
already there, so most hosts need no build config.

Set these environment variables:

```
NODE_ENV=production            # required - enables prod safety, disables introspection
PORT=4000                      # most hosts inject their own; leave it if so
MONGODB_URI=<Atlas SRV string>
JWT_SECRET=<openssl rand -base64 48>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-domain            # CORS + the URL baked into QR codes
SUPER_ADMIN_EMAIL=you@yourdomain
SUPER_ADMIN_PASSWORD=<a strong password>    # see the warning below
SUPER_ADMIN_NAME=Platform Admin
PLATFORM_FEE_RATE=0.003
PLATFORM_BANK_NAME=<your bank>
PLATFORM_BANK_CARD=<your card number>
PLATFORM_BANK_HOLDER=<account holder>
TELEGRAM_BOT_TOKEN=<from @BotFather, optional>
```

In Atlas, allow your host's outbound IPs under **Network Access**. Some hosts
have no fixed egress IP, in which case `0.0.0.0/0` plus a strong DB password is
the practical option.

## 2. Frontend

Root directory `frontend/`. Build `npm run build`, start `npm start`.

```
NEXT_PUBLIC_API_URL=https://api.your-domain/graphql
NEXT_PUBLIC_WS_URL=wss://api.your-domain/graphql
NEXT_PUBLIC_APP_URL=https://your-domain
NEXT_PUBLIC_APP_NAME=Vivora
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<optional>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<optional>
```

**`wss://` not `ws://`.** A browser on an HTTPS page refuses to open a plain
WebSocket, and the failure is silent - the kitchen screen simply stops
receiving new orders while looking fine.

These are baked in at build time, so changing them needs a redeploy.

## 3. Print agent

Not deployed by you. Each restaurant installs it on the PC next to their
printer; point its config at the production API URL. See `print-agent/README.md`.

---

## Before going live

- [ ] **Set `SUPER_ADMIN_PASSWORD` before the first boot.** The account is
      created on startup and the variable is ignored afterwards, so a weak
      value chosen now can only be changed from the dashboard later. In
      production the server refuses to start without it.
- [ ] **Set `JWT_SECRET`.** The server refuses to start in production without
      it, so you'll notice - but generate a real random one, not a guessable string.
- [ ] **Fill in the bank details.** The To'lov page shows placeholders
      (`8600 0000 0000 0000`) until `PLATFORM_BANK_*` are set, so restaurants
      would be told to transfer money to a fake card.
- [ ] **Point `FRONTEND_URL` at the real domain before generating QR codes.**
      The URL is encoded into each QR image at creation time; codes made
      against localhost keep pointing at localhost forever and have to be
      regenerated and reprinted.
- [ ] **Seed nothing.** `npm run seed` wipes and recreates the demo
      restaurant - never run it against production.
- [ ] Decide what happens to the contact form. It currently shows a success
      toast and sends nothing.

## Verified production behaviour

Checked against a production-mode boot of this codebase:

- GraphQL introspection is refused, and no playground is served.
- The schema is generated in memory, so no source tree or writable disk needed.
- The server binds `0.0.0.0`, so container hosts can route to it.
- `FRONTEND_URL` accepts a comma-separated list if you need a second origin.
