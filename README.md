# PeaNut — Nepal's marketplace

Next.js 16 (App Router) + Prisma/PostgreSQL + NextAuth. Customers shop and pay with Khalti, card (Stripe) or Cash on Delivery; sellers manage stores, orders and payouts; admins moderate everything.

## Setup

```bash
npm install
cp .env.example .env        # fill in the values — see the comments in the file
npx prisma db push          # create/update the database tables
npm run db:seed             # optional: sample categories and products
npm run dev                 # http://localhost:3000
```

The minimum to boot is `DATABASE_URL`, `NEXTAUTH_URL` and `NEXTAUTH_SECRET`. Every other integration is optional and switches itself off when its keys are missing (emails and SMS are logged instead of sent, the Card option reports that it's unavailable, images are stored in `public/uploads`).

### Payments

- **Khalti** — set `KHALTI_SECRET_KEY` (sandbox by default; set `KHALTI_BASE_URL=https://khalti.com/api/v2` in production).
- **Stripe** — set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Locally: `stripe listen --forward-to localhost:3000/api/payments/stripe/webhook`.
- **Abandoned payments** — `GET /api/payments/reconcile` (with `Authorization: Bearer $CRON_SECRET`) confirms payments whose customer closed the tab and cancels unpaid online orders after an hour, returning their stock. `vercel.json` runs it every 10 minutes on Vercel (Pro plan; Hobby allows daily crons only). Elsewhere, call it from any scheduler:
  `curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/payments/reconcile`

### First admin

Register normally, then promote the account:

```bash
npx prisma studio   # User table → set role to SUPER_ADMIN
```

## Project layout

| Path | What's there |
|---|---|
| `app/page.tsx`, `app/components/pages/` | The storefront single-page app (`/?page=…&id=…`) |
| `app/apps/{shop,account,seller,admin,auth}/` | Routed pages, served at clean URLs (`/products/:slug`, `/account/orders`, `/admin`, …) via `next.config.js` rewrites |
| `app/apps/api/` | API routes, served at `/api/*` |
| `app/lib/` | Business logic: pricing, coupons, shipping, order lifecycle, payments, notifications |
| `proxy.ts` | Server-side route protection by role (Next 16's replacement for `middleware.ts`) |
| `prisma/schema.prisma` | Database schema |

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm test           # unit tests (Vitest)
npm run lint
```

## Admin settings

Commission, payout limits, free-shipping threshold, return window, feature toggles (maintenance mode, seller auto-approval, loyalty, referrals, flash sales), shipping zones and homepage banners are all managed at `/admin/settings`.
