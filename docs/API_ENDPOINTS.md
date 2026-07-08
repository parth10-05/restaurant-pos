# API Endpoints — Restaurant POS Backend

Base URL: `/api`

This file summarizes the main HTTP endpoints implemented by the backend service. It is intended as a concise reference for developers and QA. For each endpoint we list method, path, authorization requirements, parameters, and short examples.

---

**Auth**

- **POST /auth/login**
  - Description: Authenticate user, return JWT token and user info
  - Body: { "email": "user@example.com", "password": "secret" }
  - Response: { "token": "<jwt>", "user": { id, name, role } }
  - Notes: Used by frontend to populate auth state.

- **POST /auth/signup**
  - Description: Register new user (admin only or open depending env)
  - Body: { "name", "email", "password", "role" }

- **GET /auth/me**
  - Description: Return current authenticated user
  - Auth: `Authorization: Bearer <token>`

---

**Admin (prefix: /admin)** — requires `admin` role

- **Products**
  - `GET /admin/products` — list products (query: `categoryId`, `search`, `isActive`, `page`, `limit`)
  - `GET /admin/products/:id` — get product
  - `POST /admin/products` — create product (body: name, price, categoryId, ingredients[], kitchenStation, isActive)
  - `PUT /admin/products/:id` — update product
  - `DELETE /admin/products/:id` — soft-delete (sets `isActive=false`)

- **Categories**
  - `GET /admin/categories` — list
  - `POST /admin/categories` — create (name, sequence)
  - `PUT /admin/categories/:id` — update
  - `DELETE /admin/categories/:id` — delete

- **Ingredients**
  - `GET /admin/ingredients` — list/search (query: `q`, `minStock`)
  - `POST /admin/ingredients` — create (name, unit, cost, minStock)
  - `PUT /admin/ingredients/:id`
  - `DELETE /admin/ingredients/:id`

- **Floors & Tables**
  - `GET /admin/floors` — list floors
  - `POST /admin/floors` — create floor (name, layout meta)
  - `PUT /admin/floors/:id`
  - `DELETE /admin/floors/:id`
  - `GET /admin/tables` — list tables (optional `floorId`)
  - `POST /admin/tables` — create table (floorId, number, seats)
  - `PUT /admin/tables/:id`
  - `DELETE /admin/tables/:id`

- **Users**
  - `GET /admin/users` — list users
  - `GET /admin/users/:id`
  - `POST /admin/users` — invite/create
  - `PUT /admin/users/:id`
  - `DELETE /admin/users/:id`

- **POS Config & Receipt Settings**
  - `GET /admin/pos-config`, `PUT /admin/pos-config`
  - `GET /admin/receipt-settings`, `PUT /admin/receipt-settings`

- **Reports**
  - `GET /admin/reports/sales?start=YYYY-MM-DD&end=YYYY-MM-DD` — sales summary
  - `GET /admin/reports/session/:id` — session report

- **AI / Analytics (proxy to AI service)**
  - `POST /admin/ai/demand-forecast` — body: { historical_data, periods }
  - `POST /admin/ai/waste-risk` — body: { ingredientStocks, consumptionHistory }
  - `POST /admin/ai/inventory-simulation` — body: { stock, demandScenario }
  - Notes: Backend forwards to AI service at `AI_SERVICE_URL` and returns the AI response.

---

**Cashier (prefix: /cashier)** — requires `cashier` role

- **Sessions**
  - `POST /cashier/sessions` — open session (cashierId, openingCash)
  - `GET /cashier/sessions/:id` — session details
  - `POST /cashier/sessions/:id/close` — close session, reconcile cash

- **Orders**
  - `POST /cashier/orders` — create order (tableId, lines: [{productId, qty, notes}], customer?, payment?)
  - `GET /cashier/orders/:id` — get order
  - `PUT /cashier/orders/:id` — update (modify lines prior to payment)
  - `POST /cashier/orders/:id/pay` — finalize payment (method, amount, change)

- **Products (POS list)**
  - `GET /cashier/products` — products optimized for POS (category filter, search)

---

**Kitchen (prefix: /kitchen)** — requires `kitchen` role

- **Tickets**
  - `GET /kitchen/tickets` — list active tickets (query: `station`, `status`)
  - `GET /kitchen/tickets/:id` — detail
  - `PUT /kitchen/tickets/:id/status` — update ticket status (`preparing`, `ready`, `served`)

- **Order Status Updates**
  - `PATCH /kitchen/orders/:id/status` — update order-level status
  - Real-time: server emits `ticket-update` via Socket.IO to `kitchen-station-<station>` rooms.

---

**Inventory & Waste**

- **Inventory**
  - `GET /admin/inventory/stock` — current stock levels
  - `POST /admin/inventory/adjust` — manual stock adjustment (ingredientId, change, reason)
  - `GET /admin/inventory/ledger?ingredientId=&limit=` — ledger entries

- **Waste**
  - `POST /admin/waste` — record waste event (ingredientId, qty, reason, station)
  - `GET /admin/waste` — list waste events

---

**Other / Utilities**

- `GET /health` — health check
- `GET /version` — service/version metadata

---

Authentication & Authorization

- Most protected routes expect `Authorization: Bearer <jwt>` header.
- Roles: `admin`, `cashier`, `kitchen`. Middleware enforces role and session constraints where relevant.

Common patterns

- Pagination: `page`, `limit` query params. Responses include `{ data: [], meta: { page, limit, total } }`.
- Errors: `{ "error": { "code": "BAD_REQUEST", "message": "..." } }` or standard HTTP codes.

Examples

- Login request

```json
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "secret"
}

200 OK
{
  "token": "eyJhbGci...",
  "user": { "id": "u_1", "name": "Admin User", "role": "admin" }
}
```

- Demand forecast (AI)

```json
POST /api/admin/ai/demand-forecast
Authorization: Bearer <token>

{
  "historical_data": [{ "date": "2026-02-01", "qty": 120 }, ...],
  "periods": 30
}

200 OK
{
  "predictions": [{ "date": "2026-03-01", "predicted": 130, "lower": 110, "upper": 150 }, ...]
}
```

---

Next steps

- Convert this reference into a full OpenAPI/Swagger spec (suggested).
- Add example request/response schemas for each resource with field-level docs.

If you want, I can:
- generate an OpenAPI YAML from this reference, or
- add full body/response schemas for a selected resource (e.g., Orders).
