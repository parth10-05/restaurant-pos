# Quick Reference Guide

## 🚀 Start All Services

```bash
# Terminal 1 - Backend
cd restaurant-pos-backend
npm install
npx prisma generate
npm start  # → http://localhost:3000

# Terminal 2 - Frontend
cd restaurant-pos-frontend
npm install
npm run dev  # → http://localhost:5173

# Terminal 3 - AI Service
cd restaurant-ai-service
python -m venv venv
.\venv\Scripts\activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # → http://localhost:8000
```

## 📊 Tech Stack Overview

| Layer | Technology | Port | Role |
|-------|-----------|------|------|
| Frontend | React 19 + Vite + TailwindCSS | 5173 | User interface |
| Backend | Node 18 + Express + Prisma | 3000 | Business logic, API |
| AI Service | Python + FastAPI | 8000 | ML forecasting |
| Database | PostgreSQL (Neon) | - | Data persistence |
| Real-time | Socket.IO | - | Kitchen displays |

## 🔄 Data Flow

### Product Search Flow
```
User types in search box (ProductsTab.jsx)
  ↓ debounced 300ms
productService.getAll({ search: "..." }) (frontend)
  ↓ axios GET /api/admin/products?search=...
product.controller.js → product.service.getAllProducts()
  ↓ Prisma query with contains filter
PostgreSQL returns matching products
  ↓ includes category + ingredients
Frontend renders ProductsTable
```

### Order Creation Flow
```
Cashier selects products (POSPage.jsx)
  ↓
orderService.create() (frontend)
  ↓ POST /api/cashier/orders
order.controller → order.service.createOrder()
  ↓ Prisma transaction:
    1. Create Order
    2. Create OrderLines
    3. Create KitchenTicket (if needed)
    4. Deduct InventoryStock
    5. Log InventoryLedger
  ↓ Socket.IO emit
Kitchen displays receive update (KitchenPage.jsx)
```

### AI Forecasting Flow
```
Admin clicks "Generate Forecast" (AITab.jsx)
  ↓
aiService.getDemandForecast() (frontend)
  ↓ GET /api/admin/ai/demand-forecast
ai.controller.js (backend)
  ↓ Fetch historical sales from Prisma
  ↓ HTTP POST to AI Service
FastAPI → demand_forecasting.py
  ↓ Prophet/ARIMA model
Returns predictions with confidence intervals
  ↓ Backend saves to SalesForecast table
  ↓ Returns to frontend
Frontend renders chart (Recharts)
```

## 🗄️ Database Quick Reference

### Key Models
- **User** - auth, roles (admin/cashier/kitchen)
- **Product** - menu items, pricing, tax
- **ProductIngredient** - links products ↔ ingredients
- **Ingredient** - raw materials, stock, cost
- **Order** - customer orders, totals
- **OrderLine** - line items, kitchen status
- **InventoryStock** - current ingredient quantities
- **InventoryLedger** - audit trail of stock changes
- **WasteEvent** - waste tracking by reason
- **KitchenTicket** - kitchen display orders
- **POS_Session** - cash drawer management

### Relationships
```
Product
  ├─ 1:N ProductIngredient ─ N:1 Ingredient
  │                               ├─ 1:1 InventoryStock
  │                               ├─ 1:N InventoryLedger
  │                               └─ 1:N WasteEvent
  └─ N:1 ProductCategory

Order
  ├─ N:1 POS_Session
  ├─ N:1 User (cashier)
  ├─ N:1 Table ─ N:1 Floor
  ├─ 1:N OrderLine
  ├─ 1:1 Payment
  ├─ 1:1 KitchenTicket
  └─ 1:N InventoryLedger
```

## 🔐 Auth Quick Reference

### Roles
- **admin** - Full access, reports, AI, settings
- **cashier** - POS, orders, sessions
- **kitchen** - Kitchen display only

### Token Flow
1. POST /api/auth/login → JWT token
2. Store in localStorage
3. Axios interceptor adds to all requests: `Authorization: Bearer {token}`
4. Backend middleware verifies JWT
5. Controller checks user role

## 📡 API Endpoints (Quick)

### Admin
```
GET    /api/admin/products?search=&categoryId=&isActive=
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id

GET    /api/admin/ingredients/search?q=
POST   /api/admin/ingredients

GET    /api/admin/ai/demand-forecast
```

### Cashier
```
POST   /api/cashier/sessions/open
POST   /api/cashier/sessions/close
POST   /api/cashier/orders
GET    /api/cashier/products
```

### Kitchen
```
GET    /api/kitchen/tickets
PUT    /api/kitchen/tickets/:id/status
```

## 🎨 UI Component Tree

```
App.jsx
├─ Login / Signup
├─ AdminPage
│  ├─ DashboardTab
│  ├─ ProductsTab
│  │  ├─ CategorySidebar
│  │  ├─ ProductsTable
│  │  └─ ProductForm (modal)
│  │     └─ IngredientSearch
│  ├─ ReportsTab
│  └─ AITab
├─ POSPage
│  ├─ SessionControl
│  ├─ TableSelection
│  ├─ OrderEntry
│  └─ PaymentModal
└─ KitchenPage
   └─ TicketDashboard
      └─ TicketCard[]
```

## 🔧 Common Tasks

### Add New API Endpoint
1. Create route in `backend/src/routes/*.routes.js`
2. Add controller method in `backend/src/controllers/*.controller.js`
3. Add service method in `backend/src/services/*.service.js`
4. Add frontend service method in `frontend/src/services/*.service.js`
5. Call from component

### Add New Database Model
1. Update `backend/prisma/schema.prisma`
2. Run `npx prisma generate`
3. Run `npx prisma db push` (or migrate)
4. Update relevant services

### Add New UI Page
1. Create component in `frontend/src/pages/`
2. Add route in `App.jsx`
3. Create service in `frontend/src/services/`
4. Add ProtectedRoute if needed

## 📦 Docker Compose

```yaml
services:
  backend:
    image: restaurant-backend
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://...
      JWT_SECRET: ...
      AI_SERVICE_URL: http://ai-service:8000
  
  frontend:
    image: restaurant-frontend
    ports: ["80:80"]
  
  ai-service:
    image: restaurant-ai-service
    ports: ["8000:8000"]
```

Run: `docker-compose up -d`

## 🐛 Debugging Tips

### Backend not starting?
- Check DATABASE_URL in .env
- Run `npx prisma generate`
- Check PORT not in use: `netstat -ano | findstr :3000`

### Frontend API errors?
- Check VITE_API_URL matches backend
- Inspect Network tab for failed requests
- Check JWT token in localStorage

### Prisma errors?
- Run `npx prisma generate` after schema changes
- Use `npx prisma studio` to inspect database
- Check Prisma documentation for syntax

### Search not working?
- Backend: Check `filters.search` passed to Prisma
- Frontend: Check `params.search` sent to API
- Verify `mode: 'insensitive'` in Prisma query

## 📝 Environment Files

### backend/.env
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3000
AI_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

### frontend/.env
```env
VITE_API_URL=http://localhost:3000
```

### ai-service/.env
```env
PORT=8000
LOG_LEVEL=info
```

## 🎯 Key Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Product CRUD | ✅ | With ingredients |
| Global Search | ✅ | Debounced, case-insensitive |
| Ingredient Management | ✅ | Search, inline create |
| Category Counter | ✅ | Active products only |
| Soft Delete | ✅ | isActive flag |
| Order Management | ✅ | POS flow complete |
| Kitchen Display | ✅ | Real-time Socket.IO |
| Inventory Tracking | ✅ | Stock + ledger |
| Waste Tracking | ✅ | By reason/station |
| AI Forecasting | ✅ | Demand + waste risk |
| Reports | ✅ | Sales analytics |
| Multi-user Auth | ✅ | JWT + roles |
| PDF Receipts | ✅ | PDFKit |

## 📚 File Counts
- **Backend:** 26 models, 15 services, 13 routes, 16 controllers
- **Frontend:** 5 pages, 9 services, 3 role modules
- **AI Service:** 3 routers, 3 services

---

**Total Services:** 3 (Backend + Frontend + AI)  
**Total Lines of Code:** ~15,000+ (estimated)  
**Database Tables:** 26  
**API Endpoints:** 50+
