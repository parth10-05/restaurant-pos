# Restaurant POS System

A comprehensive, full-stack Point of Sale (POS) system designed for modern restaurants. It features real-time ordering, kitchen display systems (KDS), inventory tracking, specific role-based access (Cashier, Kitchen, Admin), and AI-powered sales forecasting.

## Complete Tech Stack

### Frontend (Client App)
*   **Framework:** React 18 (Vite)
*   **Styling:** Tailwind CSS
*   **State Management:** React Hooks (Context API)
*   **Real-time Communication:** Socket.io-client
*   **HTTP Client:** Axios
*   **Routing:** React Router DOM
*   **Icons:** Heroicons

### Backend (API Server)
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **ORM:** Prisma (Object-Relational Mapping)
*   **Authentication:** JSON Web Tokens (JWT) & Bcrypt
*   **Real-time Server:** Socket.io
*   **PDF Generation:** PDFKit (for receipts)
*   **Scheduling:** Node-cron (for automated tasks)
*   **Validation:** Joi / Express-Validator

### AI & Analytics Service
*   **Language:** Python 3.10+
*   **Framework:** FastAPI (High-performance web framework)
*   **Data Processing:** Pandas, NumPy
*   **Server:** Uvicorn

### Database & Storage
*   **Primary Database:** SQLite (Dev) / PostgreSQL (Prod) - Managed via Prisma

---

## Key Features

*   **Role-Based Dashboards:**
    *   **Admin:** Full control over menu, inventory, staff, and analytics.
    *   **Cashier:** Fast billing, table management, order processing, and receipt generation.
    *   **Kitchen:** Real-time KDS (Kitchen Display System) to view and update order status.
*   **Inventory Management:** Automatic stock deduction based on recipes defined for products.
*   **Real-time Updates:** Instant order notifications between POS and Kitchen using WebSockets.
*   **Receipt Printing:** Digital and printable PDF receipts with customizable layouts.
*   **AI Insights:** Sales predictions for better inventory planning.

---

## Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   Git

### 1. Backend Setup
```bash
cd restaurant-pos-backend

# Install dependencies
npm install

# Configure Environment
# Copy .env.example to .env and update DATABASE_URL

# Database Setup
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed    # Seeds default admin/cashier and menu data

# Start Server
npm run dev
```

### 2. Frontend Setup
```bash
cd restaurant-pos-frontend

# Install dependencies
npm install

# Start Development Server
npm run dev
```
Access the application at `http://localhost:5173`

### 3. AI Service Setup
```bash
cd restaurant-ai-service

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Service
uvicorn app.main:app --reload
```

## 🔐 Default Credentials
*(For Development/Testing Only)*

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@restaurant.com` | `password123` |
| **Cashier** | `cashier@restaurant.com` | `password123` |
| **Kitchen** | `kitchen@restaurant.com` | `password123` |
