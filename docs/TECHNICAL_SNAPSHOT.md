# Restaurant POS System - Technical Snapshot

**Project Name:** Adani Chodoo Restaurant POS  
**Architecture:** Microservices (Backend + Frontend + AI Service)  
**Date:** February 10, 2026

---

## 🏗️ System Architecture

### High-Level Structure
```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Frontend      │────▶│   Backend       │────▶│   PostgreSQL     │
│   (React/Vite)  │     │   (Node/Express)│     │   (Neon DB)      │
└─────────────────┘     └─────────────────┘     └──────────────────┘
                               │
                               │ HTTP API
                               ▼
                        ┌─────────────────┐
                        │   AI Service    │
                        │   (FastAPI)     │
                        └─────────────────┘
```

### Communication
- **Frontend ↔ Backend:** REST API (axios) + WebSocket (Socket.IO)
- **Backend ↔ AI Service:** HTTP REST API
- **Backend ↔ Database:** Prisma ORM
- **Real-time:** Socket.IO for kitchen display updates

---

## 📦 Backend Service (Node.js)

### Tech Stack
| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | ≥18.0.0 |
| Framework | Express.js | ^4.18.2 |
| ORM | Prisma | ^5.9.0 |
| Database | PostgreSQL | (Neon Serverless) |
| Authentication | JWT | jsonwebtoken ^9.0.2 |
| Password Hashing | bcrypt | ^5.1.1 |
| Real-time | Socket.IO | ^4.8.3 |
| PDF Generation | PDFKit | ^0.17.2 |
| Task Scheduler | node-cron | ^4.2.1 |

### Project Structure
```
restaurant-pos-backend/
├── src/
│   ├── server.js              # Entry point
│   ├── app.js                 # Express app configuration
│   ├── config/
│   │   └── env.js             # Environment configuration
│   ├── prisma/
│   │   └── client.js          # Prisma client singleton
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT verification
│   │   ├── role.middleware.js     # Role-based access control
│   │   └── session.middleware.js  # POS session validation
│   ├── controllers/            # Request handlers (16 controllers)
│   ├── services/               # Business logic layer (15 services)
│   ├── routes/                 # API route definitions (13 route files)
│   ├── socket/                 # WebSocket handlers
│   └── ai/                     # AI integration
│       ├── index.js
│       ├── services/
│       ├── models/
│       ├── jobs/
│       └── data/
└── prisma/
    ├── schema.prisma           # Database schema (26 models)
    └── seed-*.js               # Database seeders
```

### API Routes
```
/api
├── /auth
│   ├── POST /login
│   ├── POST /signup
│   └── GET  /me
├── /admin                      # Protected: Admin only
│   ├── /products
│   ├── /categories
│   ├── /ingredients           # Ingredient CRUD + search
│   ├── /floors
│   ├── /tables
│   ├── /users
│   ├── /pos-config
│   ├── /receipt-settings
│   ├── /reports
│   └── /ai                    # AI module routes
│       ├── /demand-forecast
│       ├── /waste-risk
│       └── /inventory-simulation
├── /cashier                   # Protected: Cashier role
│   ├── /sessions
│   ├── /orders
│   └── /products
└── /kitchen                   # Protected: Kitchen role
    ├── /tickets
    └── /orders/{id}/status
```

### Core Services
1. **auth.service.js** - JWT generation, password hashing, user authentication
2. **product.service.js** - Product CRUD, ingredient associations, soft delete
3. **category.service.js** - Category management, active product counting
4. **ingredient.service.js** - Ingredient CRUD, search functionality
5. **order.service.js** - Order lifecycle, payment processing, kitchen tickets
6. **session.service.js** - POS session open/close, cash reconciliation
7. **floor.service.js** / **table.service.js** - Floor plan, table management
8. **kitchen.service.js** - Kitchen ticket management, order status updates
9. **report.service.js** - Sales analytics, session reports
10. **analytics.service.js** - Dashboard metrics, trending data
11. **receipt.service.js** - PDF receipt generation
12. **waste.service.js** - Waste tracking, inventory ledger
13. **ai.service.js** - Integration with Python AI microservice

### Database Schema (Prisma)

#### Core Models (26 total)
```prisma
User              # Authentication, role-based access
ProductCategory   # Menu categorization, sequence ordering
Product           # Menu items, pricing, tax, kitchen routing
ProductIngredient # Many-to-many: Product ↔ Ingredient
Floor / Table     # Restaurant layout management
Order             # Order lifecycle, status tracking
OrderLine         # Line items, kitchen routing, status
Payment           # Payment method, amount
POS_Session       # Cash drawer session management
KitchenTicket     # Kitchen display orders
PosConfig         # Global POS settings
ReceiptSettings   # Receipt customization

# Inventory Module
Ingredient        # Raw materials, units, cost, min stock
InventoryStock    # Current stock levels
InventoryLedger   # Stock movement audit trail
WasteEvent        # Waste tracking by reason/station

# AI/Analytics Module
SalesForecast           # Revenue predictions (daily/hourly)
ProductDemandForecast   # Product quantity predictions
SalesAnomaly            # Spike/drop detection
AIJob                   # AI task queue/history
```

#### Key Enums
```prisma
KitchenStation   # GRILL | FRYER | DRINKS | DESSERT | GENERAL
StockChangeSource # ORDER_CONSUMPTION | WASTE | MANUAL_ADJUSTMENT | PURCHASE
WasteReason      # SPOILAGE | OVERCOOKED | RETURNED | PREP_LOSS
```

### Authentication & Authorization
- **Strategy:** JWT-based stateless authentication
- **Token Storage:** LocalStorage (frontend), Authorization header
- **Roles:** `admin`, `cashier`, `kitchen`
- **Middleware Chain:**
  1. `auth.middleware.js` - Validates JWT token
  2. `role.middleware.js` - Checks user role permissions
  3. `session.middleware.js` - Validates active POS session (cashier only)

### Business Logic Patterns
- **Soft Delete:** Products use `isActive: false` instead of deletion
- **Audit Trail:** InventoryLedger tracks all stock movements
- **Sequence Control:** Categories use sequence field for POS display order
- **Kitchen Routing:** Products tagged with KitchenStation enum
- **Real-time Updates:** Socket.IO broadcasts kitchen ticket changes

---

## 🎨 Frontend Service (React)

### Tech Stack
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | ^19.2.0 |
| Build Tool | Vite | ^7.2.4 |
| Routing | React Router DOM | ^7.13.0 |
| State Management | Zustand | ^5.0.10 |
| HTTP Client | Axios | ^1.13.4 |
| Styling | TailwindCSS | ^4.1.18 |
| Charts | Recharts | ^3.7.0 |
| Real-time | Socket.IO Client | ^4.8.3 |

### Project Structure
```
restaurant-pos-frontend/
├── src/
│   ├── main.jsx               # Application entry
│   ├── App.jsx                # Root routing
│   ├── config/
│   │   └── api.js             # Axios instance, interceptors
│   ├── routes/
│   │   └── ProtectedRoute.jsx # Auth guard component
│   ├── store/
│   │   └── auth.store.js      # Zustand auth state
│   ├── services/              # API client layer (9 services)
│   │   ├── product.service.js
│   │   ├── ingredient.service.js
│   │   ├── order.service.js
│   │   ├── session.service.js
│   │   ├── kitchen.service.js
│   │   ├── report.service.js
│   │   ├── ai.service.js
│   │   └── ...
│   ├── pages/                 # Top-level route pages
│   │   ├── Login.jsx
│   │   ├── AdminPage.jsx      # Admin dashboard container
│   │   ├── POSPage.jsx        # Cashier interface container
│   │   └── KitchenPage.jsx    # Kitchen display container
│   ├── admin/                 # Admin module
│   │   ├── tabs/              # Tab content components
│   │   └── components/        # Admin-specific components
│   ├── cashier/               # Cashier module
│   ├── kitchen/               # Kitchen module
│   ├── components/            # Shared components
│   ├── layouts/               # Layout wrappers
│   ├── hooks/                 # Custom React hooks
│   └── utils/                 # Helper functions
├── public/                    # Static assets
└── nginx.conf                 # Production Nginx config
```

### Routing Structure
```
/ → RootRedirect (roles-based redirect)
/login → Login
/signup → Signup
/admin/* → AdminPage (admin only)
  ├── Dashboard
  ├── Products Tab
  ├── Categories Tab
  ├── Floors/Tables Tab
  ├── Users Tab
  ├── POS Config Tab
  ├── Reports Tab
  └── AI Analytics Tab
/pos/* → POSPage (cashier only)
  ├── Order Entry
  ├── Table Selection
  ├── Payment Processing
  └── Session Management
/kitchen/* → KitchenPage (kitchen only)
  └── Ticket Dashboard
```

### State Management
**Zustand Store:**
```javascript
// auth.store.js
{
  user: null,              // Current user object
  token: null,             // JWT token
  isAuthenticated: false,
  isLoading: true,
  login(email, password),  // Auth action
  logout(),                // Clear state
  hydrate(),               // Restore from localStorage
}
```

### API Client Pattern
```javascript
// Example: product.service.js
export const productService = {
  async getAll(filters) {
    // GET /api/admin/products?categoryId=&search=&isActive=
  },
  async getById(id) { /* ... */ },
  async create(data) { /* ... */ },
  async update(id, data) { /* ... */ },
  async delete(id) { /* ... */ },
};
```

### Key Features
1. **Product Management**
   - CRUD operations with ingredient associations
   - Real-time search across all categories (debounced 300ms)
   - Soft delete with immediate UI updates
   - Category filtering with accurate active product counts
   - Ingredient search and inline creation

2. **Order Management (POS)**
   - Table-based ordering
   - Real-time order totals with tax calculation
   - Kitchen routing per product
   - Payment processing (cash/digital/UPI)

3. **Kitchen Display**
   - Real-time ticket updates via Socket.IO
   - Status management (to_cook → preparing → ready)
   - Station-based filtering

4. **Admin Dashboard**
   - Sales analytics with charts (Recharts)
   - Session reports
   - AI-powered forecasting
   - Waste tracking

### Styling Approach
- **Framework:** TailwindCSS utility-first
- **Design System:** Neutral color palette
- **Responsive:** Mobile-first breakpoints (sm/md/lg/xl)
- **Components:** Custom-built (no UI library)

---

## 🤖 AI Service (Python FastAPI)

### Tech Stack
| Component | Library | Version |
|-----------|---------|---------|
| Framework | FastAPI | ≥0.109.0 |
| Server | Uvicorn | ≥0.27.0 |
| ML - Forecasting | Prophet | 1.1.5 (optional) |
| ML - Time Series | statsmodels | ≥0.14.0 |
| ML - Classification | scikit-learn | ≥1.4.0 |
| Data Processing | pandas | ≥2.1.0 |
| Data Processing | numpy | ≥1.26.0 |
| Validation | Pydantic | ≥2.5.3 |
| Logging | structlog | ≥24.1.0 |
| Caching | cachetools | ≥5.3.0 |

### Project Structure
```
restaurant-ai-service/
├── app/
│   ├── main.py                # FastAPI app entry
│   ├── config.py              # Configuration management
│   ├── routers/               # API endpoints
│   │   ├── demand.py          # Demand forecasting endpoints
│   │   ├── waste.py           # Waste risk endpoints
│   │   └── simulation.py      # Inventory simulation endpoints
│   ├── schemas/               # Pydantic models
│   │   ├── common.py
│   │   ├── demand.py
│   │   ├── waste.py
│   │   └── simulation.py
│   ├── services/              # Business logic
│   │   ├── demand_forecasting.py      # Prophet/ARIMA forecasting
│   │   ├── waste_risk.py              # ML-based waste scoring
│   │   └── inventory_simulation.py    # What-if analysis
│   └── utils/
│       ├── cache.py           # TTL cache decorator
│       └── logging.py         # Structured logging
├── requirements.txt
└── Dockerfile
```

### API Endpoints
```
POST /api/v1/demand/forecast
  - Input: historical sales data, forecast period
  - Output: predictions with confidence intervals, seasonality patterns
  - Models: Prophet (primary), ARIMA (fallback)

POST /api/v1/waste/risk-score
  - Input: ingredient stock, consumption history, expiration dates
  - Output: risk scores (0-1), classifications (LOW/MEDIUM/HIGH), recommendations
  - Models: Gradient Boosting (primary), rule-based (fallback)

POST /api/v1/simulation/inventory
  - Input: current stock, demand scenario, constraints
  - Output: stockout probabilities, waste projections, recommendations
  - Method: Monte Carlo simulation with demand modeling
```

### ML Models

#### 1. Demand Forecasting
- **Primary:** Facebook Prophet
  - Handles seasonality (daily, weekly, monthly)
  - Automatic holiday effects
  - Robust to missing data
  - Returns confidence intervals
- **Fallback:** ARIMA (statsmodels)
  - Simpler time series model
  - Used when Prophet unavailable or insufficient data

#### 2. Waste Risk Scoring
- **Primary:** Gradient Boosting Classifier (scikit-learn)
  - Features: days to expiration, consumption velocity, seasonality, stock ratio
  - Trained on synthetic/historical waste events
  - Outputs probability distribution across risk levels
- **Fallback:** Rule-based scoring
  - Heuristic rules based on domain knowledge
  - No training required

#### 3. Inventory Simulation
- **Method:** Monte Carlo simulation
  - Random sampling of demand scenarios
  - Projects stock levels over time
  - Calculates stockout/overstock probabilities
- **Scenario Types:**
  - Demand changes (±X%)
  - Promotional events
  - Supplier delays
  - Custom parameters

### Caching Strategy
```python
@cache.ttl_cache(ttl=300)  # 5-minute cache
def forecast_demand(params):
    # Expensive ML computation cached
```

### Error Handling
- **Validation:** Pydantic automatic validation
- **Logging:** Structured JSON logs via structlog
- **Fallbacks:** Graceful degradation to simpler models
- **HTTP:** RESTful status codes (200, 400, 422, 500)

---

## 🗄️ Database Design

### Connection
- **Provider:** Neon Serverless PostgreSQL
- **Connection Pooling:** Enabled via Neon pooler
- **SSL:** Required (`sslmode=require`)
- **ORM:** Prisma (type-safe, auto-migrations)

### Schema Highlights

#### Product & Inventory
```
Product 1──N ProductIngredient N──1 Ingredient
                                         │
                                         ├──1──1 InventoryStock
                                         ├──1──N InventoryLedger
                                         └──1──N WasteEvent
```

#### Order Flow
```
Order
  ├──N OrderLine (product details, kitchen routing)
  ├──1 Payment
  ├──1 KitchenTicket
  └──N InventoryLedger (stock deduction audit)
```

#### AI/Analytics Data
```
SalesForecast (historical + predictions)
ProductDemandForecast (per-product predictions)
SalesAnomaly (outlier detection)
AIJob (task tracking)
```

### Indexes
- `@@index([ingredientId, createdAt])` - Ledger queries
- `@@index([productId, targetDate])` - Forecast lookups
- `@@index([type, status])` - AI job queries
- `@@unique([productId, ingredientId])` - Product-ingredient uniqueness
- `@@unique([floorId, number])` - Table number uniqueness per floor

### Data Integrity
- **Foreign Keys:** Cascade deletes where appropriate
- **Unique Constraints:** Prevent duplicates (category names, ingredient names)
- **Enums:** Type-safe status fields
- **Soft Deletes:** `isActive` flag for products
- **Audit Trails:** `createdAt`, `updatedAt` on all models

---

## 🔄 Integration Points

### Backend → AI Service
```javascript
// backend/src/ai/services/
const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function getDemandForecast(salesData) {
  const response = await axios.post(
    `${aiServiceUrl}/api/v1/demand/forecast`,
    { historical_data: salesData, periods: 30 }
  );
  return response.data;
}
```

### Frontend → Backend → AI
```
Frontend (admin/AITab.jsx)
   │
   ├── GET /api/admin/ai/demand-forecast
   │     └─▶ Backend (ai.controller.js)
   │           └─▶ AI Service (POST /api/v1/demand/forecast)
   │                 └─▶ Returns predictions
```

### Real-time Updates (Socket.IO)
```javascript
// Backend emits
io.to(`kitchen-station-${station}`).emit('ticket-update', ticket);

// Frontend listens
socket.on('ticket-update', (ticket) => {
  updateKitchenDisplay(ticket);
});
```

---

## 🛠️ Development Workflow

### Environment Setup
```bash
# Backend (Node.js)
cd restaurant-pos-backend
npm install
npx prisma generate
npx prisma db push
npm run dev  # Starts on port 3000

# Frontend (React)
cd restaurant-pos-frontend
npm install
npm run dev  # Starts on port 5173

# AI Service (Python)
cd restaurant-ai-service
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload  # Starts on port 8000
```

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3000
AI_SERVICE_URL=http://localhost:8000

# Frontend (.env)
VITE_API_URL=http://localhost:3000

# AI Service (.env)
PORT=8000
LOG_LEVEL=info
```

### Database Migrations
```bash
npx prisma migrate dev --name migration_name
npx prisma generate  # Regenerate client
npx prisma db seed   # Run seeders
```

---

## 🚀 Deployment

### Docker Compose
```yaml
services:
  backend:
    build: ./restaurant-pos-backend
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=...
      - JWT_SECRET=...
  
  frontend:
    build: ./restaurant-pos-frontend
    ports: ["80:80"]  # Nginx
  
  ai-service:
    build: ./restaurant-ai-service
    ports: ["8000:8000"]
```

### Container Images
- **Backend:** Node 18 Alpine
- **Frontend:** Node 18 (build) → Nginx Alpine (serve)
- **AI Service:** Python 3.10

### Production Considerations
- **Frontend:** Nginx serves static build, proxies `/api` to backend
- **Backend:** PM2 or Docker restart policies for crash recovery
- **Database:** Neon serverless auto-scales
- **AI Service:** Consider GPU instance for large-scale Prophet models
- **Secrets:** Use environment variables, never commit .env files

---

## 📊 Key Metrics & Monitoring

### Application Metrics (Future)
- Order processing time
- Kitchen ticket completion time
- API response times
- AI model inference latency
- Cache hit rates

### Business Metrics
- Orders per session
- Average order value
- Waste percentage by ingredient
- Forecast accuracy (MAPE, RMSE)
- Category-wise sales distribution

---

## 🔐 Security

### Authentication
- **JWT Tokens:** HS256 signing, expiration handling
- **Password Hashing:** bcrypt with salt rounds
- **Token Storage:** LocalStorage (consider HttpOnly cookies for production)

### Authorization
- **Role-based Access Control (RBAC):** admin, cashier, kitchen
- **Route Protection:** Middleware checks on all protected endpoints
- **Session Validation:** Cashiers must have active POS session

### API Security
- **CORS:** Configured in Express
- **Input Validation:** Pydantic (AI service), manual (backend)
- **SQL Injection:** Prevented by Prisma parameterized queries
- **Error Messages:** Generic messages in production (no stack traces)

---

## 🧪 Testing Strategy (Recommended)

### Backend
- **Unit Tests:** Jest for services
- **Integration Tests:** Supertest for API endpoints
- **Database:** In-memory SQLite for test isolation

### Frontend
- **Unit Tests:** Vitest for components/hooks
- **E2E Tests:** Playwright for critical flows

### AI Service
- **Unit Tests:** pytest for model logic
- **Integration Tests:** httpx for API endpoints

---

## 📈 Future Enhancements

### Technical Debt
- [ ] Move to HttpOnly cookies for JWT storage
- [ ] Add Redis for distributed caching
- [ ] Implement API rate limiting
- [ ] Add comprehensive test coverage
- [ ] Set up CI/CD pipeline

### Features
- [ ] Multi-location support (franchises)
- [ ] Mobile app (React Native)
- [ ] Customer loyalty program
- [ ] Online ordering integration
- [ ] Advanced inventory auto-replenishment
- [ ] Multi-currency support
- [ ] Printer integration (thermal receipts)

### AI/ML
- [ ] Real-time anomaly alerting
- [ ] Customer behavior clustering
- [ ] Recipe optimization based on waste patterns
- [ ] Dynamic pricing recommendations
- [ ] Staff scheduling based on demand forecasts

---

## 📚 Dependencies Summary

### Backend (Node.js)
```
Production: express, @prisma/client, bcrypt, jsonwebtoken, 
            socket.io, cors, dotenv, pdfkit, node-cron
Dev: prisma, nodemon
```

### Frontend (React)
```
Production: react, react-dom, react-router-dom, axios, 
            zustand, socket.io-client, recharts
Dev: vite, @vitejs/plugin-react, tailwindcss, eslint
```

### AI Service (Python)
```
fastapi, uvicorn, pydantic, pandas, numpy, statsmodels, 
scikit-learn, prophet(optional), structlog, cachetools, pytest
```

---

## 🗂️ File Counts
- **Backend:** 16 controllers, 15 services, 13 route files, 26 database models
- **Frontend:** 9 service clients, 5 main pages, 3 role-specific modules
- **AI Service:** 3 routers, 3 core services, 4 schema groups

---

## 🎯 Summary

This is a **full-stack restaurant POS system** with:
- **Modern tech stack:** React 19 + Node 18 + FastAPI + PostgreSQL
- **Microservices architecture:** Separated concerns for scalability
- **Real-time capabilities:** Socket.IO for kitchen displays
- **AI-powered:** Demand forecasting, waste risk analysis, inventory simulation
- **Production-ready:** Docker containers, structured logging, error handling
- **Type-safe:** Prisma ORM, Pydantic validation
- **Role-based access:** Admin, cashier, kitchen workflows
- **Comprehensive inventory:** Ingredient tracking, waste monitoring, audit trails

**Lines of Code:** ~15,000+ (estimated)  
**Development Time:** Multi-sprint project  
**Target Deployment:** Cloud (Neon DB + Docker containers)
