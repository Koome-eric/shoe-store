# Build Plan — Savanna & Sole (working name)

## Stack confirmed
Next.js 16 (App Router), TypeScript, Prisma 7.8, Neon Postgres, Tailwind v4,
manual shadcn-style components, NextAuth v5 (Auth.js), Zod, RHF, Zustand (cart),
M-Pesa Daraja (sandbox-ready, keys added later via env).

## Scope for this pass (per user selection)
1. Storefront: catalog, PDP, cart, checkout (UI complete, order created as PENDING)
2. Auth: customer + admin (NextAuth v5, credentials + roles)
3. M-Pesa STK Push: full Daraja integration code, sandbox-safe, env-driven
4. Admin dashboard: products, orders, inventory (core CRUD + status updates)

## Out of scope for this pass (scaffolded only / noted as TODO)
- WhatsApp deep integration beyond wa.me links
- Full analytics dashboard (basic counts only)
- Wishlist persistence beyond schema
- Email notifications (schema + stub function only)
- Multi-tenant (storeId on every model, single store seeded)
- POS, loyalty, marketplace, AI insights — Phase 2/3, not built

## Design system: "Savanna Leather"
- bone #F7F3EA, ink #241F1A, forest #1A2E22, clay #C2491D, ochre #E8A33D
- Display: Archivo, Body: Inter, Mono: JetBrains Mono (SKUs/codes)
- Signature device: ruler-divider (shoe-size tick marks) used as section dividers

## Folder structure
```
src/
  app/
    (storefront)/
      page.tsx                 — homepage
      products/page.tsx        — catalog
      products/[slug]/page.tsx — PDP
      cart/page.tsx
      checkout/page.tsx
      orders/[id]/page.tsx     — order tracking
      account/...
      login/page.tsx
      register/page.tsx
    admin/
      layout.tsx               — admin shell + auth guard
      page.tsx                 — dashboard
      products/...
      orders/...
      inventory/...
    api/
      auth/[...nextauth]/route.ts
      checkout/route.ts
      mpesa/stk-push/route.ts
      mpesa/callback/route.ts
      admin/products/route.ts
      admin/orders/[id]/route.ts
      ...
  components/
    ui/        — manual shadcn primitives
    storefront/
    admin/
  lib/
    prisma.ts
    auth.ts
    mpesa.ts
    utils.ts
    validations/
  store/
    cart-store.ts
prisma/
  schema.prisma
  seed.ts
```

## Status log
- [x] Scaffold Next.js + deps
- [x] Design tokens in globals.css
- [ ] Fonts in layout
- [ ] UI primitives (button, input, card, badge, etc)
- [ ] Prisma schema
- [ ] Seed script
- [ ] Auth setup
- [ ] Storefront pages
- [ ] Cart (zustand)
- [ ] Checkout + order creation
- [ ] M-Pesa integration
- [ ] Admin dashboard
- [ ] .env.example + README
- [ ] Package as zip
