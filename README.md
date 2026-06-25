# Savanna & Sole — Shoe E-commerce Platform

A foundation build for a Kenyan shoe e-commerce business: storefront, M-Pesa
checkout, and an admin dashboard. Built with Next.js 16 (App Router),
TypeScript, Prisma 7, Neon Postgres, Tailwind v4, and Auth.js v5.

This is **not** the full spec from the original brief — it's the highest-
priority slice (storefront, auth, M-Pesa, admin core) built solidly, with
the schema and architecture designed so the rest (loyalty, POS, multi-tenant,
AI insights, etc.) can be added later without a rewrite. See
[`BUILD_PLAN.md`](./BUILD_PLAN.md) for exactly what's in and out of scope.

## 1. Install dependencies

```bash
npm install
```

This also runs `prisma generate` automatically via the `postinstall` script.
If it fails (e.g. no network for the engine binary download), run it manually
once your network is available:

```bash
npx prisma generate
```

## 2. Set up your database (Neon)

1. Create a free project at neon.tech.
2. From the Neon dashboard, copy **two** connection strings:
   - The **pooled** connection (hostname contains `-pooler`) → `DATABASE_URL`
   - The **direct** connection (no `-pooler`) → `DIRECT_URL`

   Prisma 7 needs both: the app uses the pooled one at runtime, the CLI uses
   the direct one for migrations.

3. Copy the env file and fill in both:

   ```bash
   cp .env.example .env
   ```

4. Push the schema to your database:

   ```bash
   npm run db:push
   ```

5. Seed sample data (a few products, an admin account, brands/categories):

   ```bash
   npm run db:seed
   ```

   This creates an admin login: admin@savannasole.co.ke / Admin1234!
   Change this password immediately after your first login.

Why two URLs / a prisma.config.ts file? Prisma 7 changed how it connects to
databases — it now requires an explicit driver adapter (@prisma/adapter-pg
here) instead of connecting automatically, and the CLI's connection string
lives in prisma.config.ts rather than inside schema.prisma. This project is
already wired up for that; you only need to supply the two URLs in .env.

### If you see a P1010 / SSL certificate error

Some environments don't trust Neon's certificate chain by default. If you
hit this, open src/lib/prisma.ts and add `ssl: { rejectUnauthorized: false }`
to the PrismaPg options as a quick fix, or properly configure your CA certs
per Prisma's PostgreSQL docs.

## 3. Configure M-Pesa (Daraja)

1. Create an app at the Safaricom Developer Portal (developer.safaricom.co.ke).
2. For local testing, use the **sandbox** app — it comes with a public test
   shortcode (174379) and passkey already documented on the portal.
3. Fill in `.env`:
   ```
   MPESA_ENV=sandbox
   MPESA_CONSUMER_KEY=...
   MPESA_CONSUMER_SECRET=...
   MPESA_SHORTCODE=174379
   MPESA_PASSKEY=...
   MPESA_CALLBACK_URL=https://your-public-url/api/mpesa/callback
   ```
4. MPESA_CALLBACK_URL must be a publicly reachable HTTPS URL — Daraja
   cannot reach localhost. For local development, use a tunnel:
   ```bash
   ngrok http 3000
   # then set MPESA_CALLBACK_URL to https://<ngrok-id>.ngrok.io/api/mpesa/callback
   ```
5. Sandbox STK pushes only work with Safaricom's test MSISDNs (e.g.
   254708374149) — check the Daraja docs for the current list.
6. When ready for production, switch MPESA_ENV=production, request a
   production shortcode/passkey from Safaricom, and update the callback URL
   to your live domain.

Until these are filled in, the storefront and checkout flow work end-to-end
except the M-Pesa STK push step, which will return a clear error instead of
silently failing.

## 4. Run the app

```bash
npm run dev
```

- Storefront: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin
  (log in with the seeded admin account above)

## Project structure

```
src/
  app/
    (storefront)/     — public site: home, catalog, PDP, cart, checkout, account
    admin/            — admin dashboard (auth-guarded)
    api/              — all backend routes (checkout, M-Pesa, admin CRUD)
  components/
    ui/               — manual shadcn-style primitives (button, input, dialog, ...)
    storefront/        — storefront-only components
    admin/            — admin-only components
  lib/
    prisma.ts         — Prisma client (Prisma 7 adapter pattern)
    auth.ts           — Auth.js v5 config (customer + admin credential providers)
    mpesa.ts          — Daraja API client (STK push, callback parsing)
    inventory.ts      — atomic stock decrement/restore helpers
    validations/      — Zod schemas
  generated/prisma/   — generated Prisma Client (gitignored, created by `prisma generate`)
prisma/
  schema.prisma
  seed.ts
```

## What's built vs. what's scaffolded

Fully working: product catalog with filters/sort/pagination, PDP with
size/color variants, cart (persisted client-side), guest + account checkout,
M-Pesa STK push + callback handling with live status polling, order
tracking, customer accounts + wishlist, admin product/order/inventory CRUD,
admin dashboard stats, SEO basics (sitemap, robots, OG tags, structured data).

Scaffolded / simplified for this pass:
- Coupons: schema + checkout logic exist; no admin UI to create them yet (use Prisma Studio: `npm run db:studio`)
- Notifications: created in-app on key events; no email sending wired up yet
- Image uploads: paste a URL in the admin product form; no direct R2/S3 upload widget yet
- Shipping fee: flat KES 250; not yet county-based
- Multi-tenancy: every table has storeId, but only one store is seeded

See BUILD_PLAN.md for the full breakdown against the original spec.

## Default admin login

```
Email: admin@savannasole.co.ke
Password: Admin1234!
```

Change this after your first login (there's no self-service password change
UI yet — update it directly via Prisma Studio or a script for now).
