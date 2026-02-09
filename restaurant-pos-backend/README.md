# Restaurant POS Backend

## Overview
Express + Prisma REST API for the restaurant POS stack. Provides authentication, session control, ordering, reporting, and kitchen display WebSocket events.

## Stack
- Node.js 18+
- Express 4
- Prisma 5 (PostgreSQL)
- Socket.IO 4

## Quickstart
1) Install dependencies: `npm install`
2) Copy environment: create `.env` with values below
3) Generate Prisma client: `npm run db:generate`
4) Push schema and seed (dev): `npm run db:push && npm run db:seed`
5) Start dev server: `npm run dev` (listens on `PORT` or 3000) -> base path `/api`

## Environment Variables
```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://user:pass@host:port/dbname
JWT_SECRET=replace-with-strong-secret
```

## NPM Scripts
- `npm run dev` — start with nodemon
- `npm start` — start without reload
- `npm run db:generate` — generate Prisma client
- `npm run db:push` — apply schema to DB
- `npm run db:migrate` — create/apply migration (dev)
- `npm run db:studio` — open Prisma Studio
- `npm run db:seed` — seed data from `prisma/seed.js`

## API Base
All endpoints are prefixed with `/api`. Auth uses Bearer JWT. Roles: `admin`, `kitchen`, `cashier` (default).

### Health
- `GET /api/health` — uptime check

### Auth
- `POST /api/auth/signup` — create user
- `POST /api/auth/login` — obtain JWT
- `GET /api/auth/me` — current user (auth)

### POS Sessions
- `POST /api/sessions/open` — open POS session (auth)
- `POST /api/sessions/close` — close session (auth)
- `GET /api/sessions/current` — fetch active session (auth)

### Orders (requires open session)
- `POST /api/orders` — create order
- `GET /api/orders` — list session orders
- `GET /api/orders/:id` — get order
- `POST /api/orders/:id/lines` — add line item
- `PATCH /api/orders/:id/lines/:lineId` — update line qty
- `PATCH /api/orders/:id/send` — send to kitchen
- `PATCH /api/orders/:id/complete` — mark ready for payment
- `POST /api/orders/:id/pay` — record payment
- `GET /api/orders/:orderId/receipt` — download receipt (auth)

### Kitchen (role: kitchen or admin)
- `GET /api/kitchen/orders` — kitchen order feed (item-level)
- `PUT /api/kitchen/items/:itemId/status` — update item status
- `GET /api/kitchen/tickets` — active tickets (legacy)
- `GET /api/kitchen/tickets/completed` — completed tickets (legacy)
- `GET /api/kitchen/tickets/:id` — ticket detail (legacy)
- `PATCH /api/kitchen/tickets/:id/next` — advance ticket status (legacy)

### Cashier (auth; read-only)
- `GET /api/cashier/floors` — list floors
- `GET /api/cashier/floors/:floorId/tables` — tables by floor
- `GET /api/cashier/tables/:id/active-order` — active order by table
- `GET /api/cashier/categories` — list categories
- `GET /api/cashier/products` — list products
- `GET /api/cashier/pos-config` — payment methods/config

### Admin POS Config (role: admin)
- `GET /api/admin/pos-config`
- `PUT /api/admin/pos-config`
- `GET /api/admin/payment-methods`

### Admin Products & Categories (role: admin)
- `GET /api/admin/categories`
- `GET /api/admin/categories/:id`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`
- `GET /api/admin/products`
- `GET /api/admin/products/:id`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`

### Admin Floors & Tables (role: admin)
- `GET /api/admin/floors`
- `GET /api/admin/floors/:id`
- `POST /api/admin/floors`
- `PUT /api/admin/floors/:id`
- `DELETE /api/admin/floors/:id`
- `GET /api/admin/floors/:floorId/tables`
- `POST /api/admin/floors/:floorId/tables`
- `GET /api/admin/tables/:id`
- `PUT /api/admin/tables/:id`
- `DELETE /api/admin/tables/:id`

### Admin Reports (role: admin)
Query params: `from=YYYY-MM-DD`, `to=YYYY-MM-DD` (optional).
- `GET /api/admin/reports/summary`
- `GET /api/admin/reports/payments`
- `GET /api/admin/reports/sessions`
- `GET /api/admin/reports/products`
- `GET /api/admin/reports/categories`

### Admin Settings (role: admin)
- `GET /api/admin/settings/receipt`
- `PUT /api/admin/settings/receipt`

## WebSocket (Kitchen Display)
- URL: `ws(s)://<host>:<port>` via Socket.IO (same origin as API)
- Auth: `auth: { token: <JWT> }`
- Join room: emit `kitchen:join`; leave with `kitchen:leave`
- Server emits:
  - `kitchen:item:new` — payload `{ items: [...] }`
  - `kitchen:item:update` — `{ item }`
  - `kitchen:order:update` — `{ order }`
  - `kitchen:new_order` and `kitchen:update` for legacy tickets

## Data Model (Prisma)
Entities: User, ProductCategory, Product, Floor, Table, POS_Session, Order, OrderLine, Payment, KitchenTicket, PosConfig, ReceiptSettings. Kitchen stations enum covers GRILL, FRYER, DRINKS, DESSERT, GENERAL.

## Notes for Expansion
- Add rate limiting, request logging, and input validation for public endpoints.
- Introduce migration workflow (`prisma migrate deploy`) for production instead of `db:push`.
- Consider background jobs for receipts/email, analytics, and data retention.
- Add OpenAPI/Swagger for schema documentation.
