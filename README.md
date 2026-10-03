# Parsilon Part

Mobile-first web shop for Parsilon auto parts, with an admin panel.
Next.js 15 (App Router), React 19, Prisma 7, PostgreSQL, Tailwind CSS.

## Setup

```bash
cp .env.example .env        # then fill in DATABASE_URL and JWT_SECRET
npm install
npm run db:migrate          # apply migrations
npm run dev
```

`JWT_SECRET` must be at least 32 random characters (`openssl rand -base64 48`).
The app refuses to start sessions with a missing or weak secret.

Demo data (never in production): `SEED_PASSWORD='choose-one' npm run db:seed`

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:studio` | Prisma Studio |

## How orders stay correct

- The order API accepts only product identity and quantity. Names, prices,
  shipping, VAT and totals are computed on the server from the database
  (`lib/pricing.ts`, `app/api/orders/route.ts`).
- Stock is decremented with a conditional update inside the order transaction,
  and the database has a `stock >= 0` check, so concurrent orders cannot oversell.
- Cancelling an order (admin) returns its stock exactly once.

## Not built yet

- Online payment gateway: orders are created as "pending review".
- Rate limiting is in process memory (`lib/rate-limit.ts`); use Redis when
  running more than one server instance.
- Automated tests.
