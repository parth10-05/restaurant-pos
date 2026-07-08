# Backend Technical Summary

## Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.18
- **Database:** PostgreSQL (Neon Serverless)
- **ORM:** Prisma 5.9
- **Auth:** JWT + bcrypt
- **Real-time:** Socket.IO 4.8
- **PDF:** PDFKit
- **Scheduler:** node-cron

## Architecture Pattern
```
Route Layer → Controller Layer → Service Layer → Prisma → PostgreSQL
```

## File Structure
```
src/
├── server.js                  # Entry point
├── app.js                     # Express config, middleware, error handling
├── config/env.js              # Environment variables
├── prisma/client.js           # Prisma singleton
├── middlewares/               # Auth, role, session middleware
├── controllers/               # 16 request handlers
├── services/                  # 15 business logic services
├── routes/                    # 13 API route definitions
├── socket/                    # WebSocket event handlers
└── ai/                        # AI service integration
```

## Core Services (15)
1. **auth.service.js** - Login, signup, JWT, password hashing
2. **product.service.js** - CRUD, ingredient associations, soft delete, search
3. **category.service.js** - Category CRUD, active product counting
4. **ingredient.service.js** - Ingredient CRUD, search (top 10 results)
5. **order.service.js** - Order lifecycle, line items, payments
6. **session.service.js** - POS cash drawer management
7. **floor.service.js** - Floor layout management
8. **table.service.js** - Table CRUD, floor association
9. **kitchen.service.js** - Kitchen tickets, status updates
10. **report.service.js** - Sales reports, session summaries
11. **analytics.service.js** - Dashboard KPIs, trends
12. **receipt.service.js** - PDF generation
13. **waste.service.js** - Waste tracking, inventory deduction
14. **ai.service.js** - Integration with Python AI microservice
15. **posConfig.service.js** - Global POS settings

## Database Models (26)
### Core POS
- User, ProductCategory, Product, ProductIngredient
- Floor, Table
- Order, OrderLine, Payment
- POS_Session, KitchenTicket
- PosConfig, ReceiptSettings

### Inventory
- Ingredient, InventoryStock, InventoryLedger, WasteEvent

### AI/Analytics
- SalesForecast, ProductDemandForecast, SalesAnomaly, AIJob

### Key Enums
- KitchenStation: GRILL | FRYER | DRINKS | DESSERT | GENERAL
- StockChangeSource: ORDER_CONSUMPTION | WASTE | MANUAL_ADJUSTMENT | PURCHASE
- WasteReason: SPOILAGE | OVERCOOKED | RETURNED | PREP_LOSS

## API Routes
```
/api
├── /auth
│   ├── POST /login
│   ├── POST /signup
│   └── GET  /me
├── /admin (admin role)
│   ├── /products        # CRUD + search
│   ├── /categories      # CRUD
│   ├── /ingredients     # CRUD + search
│   ├── /floors          # CRUD
│   ├── /tables          # CRUD
│   ├── /users           # CRUD
│   ├── /pos-config      # Settings
│   ├── /receipt-settings
│   ├── /reports         # Analytics
│   └── /ai              # Forecasting, waste risk
├── /cashier (cashier role)
│   ├── /sessions        # Open/close drawer
│   ├── /orders          # Create/update orders
│   └── /products        # View menu
└── /kitchen (kitchen role)
    └── /tickets         # View/update kitchen orders
```

## Authentication Flow
1. POST /api/auth/login → JWT token
2. Frontend stores token in localStorage
3. Axios interceptor adds `Authorization: Bearer {token}` to all requests
4. Backend `auth.middleware.js` verifies JWT
5. `role.middleware.js` checks user role
6. `session.middleware.js` validates active POS session (cashier only)

## Key Business Logic

### Product Management
- **Soft Delete:** `isActive: false` (preserves order history)
- **Ingredients:** Many-to-many via ProductIngredient junction
- **Search:** Case-insensitive Prisma contains query
- **Category Count:** Manual count of active products only

### Order Flow
1. Create order (draft status)
2. Add order lines (products with qty)
3. Calculate total (price * qty + taxAmount per line)
4. Create kitchen ticket (if product.sendToKitchen = true)
5. Process payment → order status = "paid"
6. Deduct ingredient stock via InventoryLedger

### Inventory System
- **Stock Tracking:** InventoryStock holds current quantity
- **Audit Trail:** InventoryLedger logs every change with source
- **Deduction on Order:** Automatic via order.service
- **Waste Tracking:** WasteEvent records with reason/station/session
- **Min Stock Alerts:** Ingredient.minStock threshold (UI checks)

### POS Session
- Cashier opens session at shift start
- All orders linked to active session
- Close session → lock session, record closing total
- Cannot create orders without active session

### Kitchen Display
- Kitchen tickets auto-created for sendToKitchen products
- Socket.IO broadcasts ticket updates in real-time
- Status flow: to_cook → preparing → ready
- Filters by KitchenStation (GRILL, FRYER, etc.)

## Integration with AI Service
```javascript
// backend/src/ai/services/
const AI_API = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Demand Forecasting
POST {AI_API}/api/v1/demand/forecast
Body: { historical_data: [...], periods: 30 }

// Waste Risk Scoring
POST {AI_API}/api/v1/waste/risk-score
Body: { ingredients: [...], consumption_history: [...] }

// Inventory Simulation
POST {AI_API}/api/v1/simulation/inventory
Body: { current_stock: {...}, scenarios: [...] }
```

## WebSocket Events (Socket.IO)
```javascript
// Server emits
io.to(`kitchen-station-${station}`).emit('ticket-update', ticket);
io.to('admin').emit('order-completed', order);

// Namespaces/Rooms
- kitchen-station-GRILL
- kitchen-station-FRYER
- admin
```

## Error Handling
```javascript
// Global error middleware in app.js
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    message,
    ...(dev mode && { stack })
  });
});
```

## Database Connection
```
Provider: postgresql
URL: Neon Serverless (connection pooling enabled)
SSL: Required
Prisma Client: Auto-generated, type-safe
```

## Key Prisma Patterns
```javascript
// Include relations
await prisma.product.findMany({
  include: {
    category: true,
    productIngredients: {
      include: { ingredient: true }
    }
  }
});

// Transactions
await prisma.$transaction([
  prisma.order.update(...),
  prisma.inventoryLedger.create(...),
  prisma.inventoryStock.update(...)
]);

// Soft delete filter
where: { isActive: true }
```

## Environment Variables
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3000
NODE_ENV=development|production
AI_SERVICE_URL=http://localhost:8000
```

## Scripts
```json
"start": "node src/server.js"
"dev": "nodemon src/server.js"
"db:generate": "prisma generate"
"db:push": "prisma db push"
"db:migrate": "prisma migrate dev"
"db:studio": "prisma studio"
"db:seed": "node prisma/seed.js"
```

## Dependencies (Key)
```json
{
  "@prisma/client": "^5.9.0",
  "bcrypt": "^5.1.1",
  "cors": "^2.8.5",
  "dotenv": "^16.4.1",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.2",
  "node-cron": "^4.2.1",
  "pdfkit": "^0.17.2",
  "socket.io": "^4.8.3"
}
```

## Recent Changes
✅ Ingredient management CRUD
✅ Product-ingredient associations
✅ Ingredient search in product form
✅ Global product search (debounced, case-insensitive)
✅ Category counter fix (counts only active products)
✅ Soft delete pattern for products
