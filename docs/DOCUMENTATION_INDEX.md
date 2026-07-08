# 📚 Project Documentation Index

This folder contains comprehensive technical documentation for the Adani Chodoo Restaurant POS System.

## 📄 Documentation Files

### 1. [TECHNICAL_SNAPSHOT.md](./TECHNICAL_SNAPSHOT.md)
**Complete System Architecture Overview**
- Entire project structure and architecture
- All three services (Backend, Frontend, AI)
- Database schema with all 26 models
- Integration points and data flows
- Deployment strategy
- Future enhancements roadmap

**Use this when:** You need a complete understanding of the entire system

---

### 2. [BACKEND_SUMMARY.md](./BACKEND_SUMMARY.md)
**Backend Technical Deep Dive**
- Node.js/Express architecture
- All 15 services detailed
- API routes and endpoints
- Prisma ORM patterns
- Authentication/authorization flow
- Business logic implementations
- Integration with AI service

**Use this when:** Working on backend features, API development, or database operations

---

### 3. [FRONTEND_SUMMARY.md](./FRONTEND_SUMMARY.md)
**Frontend Technical Deep Dive**
- React 19 architecture
- Component hierarchy
- Zustand state management
- API client patterns
- All feature implementations
- TailwindCSS styling patterns
- Socket.IO real-time updates

**Use this when:** Building UI components, implementing features, or styling

---

### 4. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
**Developer Quick Lookup Guide**
- Start commands for all services
- Common data flows illustrated
- API endpoint quick list
- Common development tasks
- Debugging tips
- Environment setup

**Use this when:** You need quick answers or step-by-step guides

---

## 🏗️ Project Overview

**Type:** Full-stack Restaurant Point of Sale (POS) System  
**Architecture:** Microservices (3 services)  
**Tech Stack:** React + Node.js + FastAPI + PostgreSQL  

### Services
1. **Frontend** - React 19 + Vite + TailwindCSS (Port 5173)
2. **Backend** - Node.js 18 + Express + Prisma (Port 3000)
3. **AI Service** - Python + FastAPI (Port 8000)
4. **Database** - PostgreSQL (Neon Serverless)

### Key Features
- 🍽️ Full POS system with order management
- 👨‍🍳 Real-time kitchen display
- 📊 AI-powered demand forecasting
- 📦 Inventory tracking with waste management
- 🧾 PDF receipt generation
- 📈 Sales analytics and reports
- 🔐 JWT-based multi-role authentication

---

## 🚀 Quick Start

```bash
# Backend
cd restaurant-pos-backend
npm install && npx prisma generate
npm start  # → http://localhost:3000

# Frontend
cd restaurant-pos-frontend
npm install
npm run dev  # → http://localhost:5173

# AI Service
cd restaurant-ai-service
python -m venv venv && .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # → http://localhost:8000
```

---

## 📁 Repository Structure

```
adani-pos/
├── restaurant-pos-backend/      # Node.js Express API
│   ├── src/                     # Source code
│   │   ├── controllers/         # 16 request handlers
│   │   ├── services/            # 15 business logic services
│   │   ├── routes/              # 13 API route files
│   │   ├── middlewares/         # Auth, role, session
│   │   └── prisma/              # Database client
│   └── prisma/
│       └── schema.prisma        # 26 database models
│
├── restaurant-pos-frontend/     # React SPA
│   └── src/
│       ├── pages/               # 5 top-level pages
│       ├── services/            # 9 API clients
│       ├── admin/               # Admin module
│       ├── cashier/             # POS module
│       └── kitchen/             # Kitchen display
│
├── restaurant-ai-service/       # Python FastAPI
│   └── app/
│       ├── routers/             # 3 ML endpoints
│       └── services/            # Forecasting, waste, simulation
│
├── TECHNICAL_SNAPSHOT.md        # Complete system overview
├── BACKEND_SUMMARY.md           # Backend deep dive
├── FRONTEND_SUMMARY.md          # Frontend deep dive
└── QUICK_REFERENCE.md           # Quick lookup guide
```

---

## 🎯 Documentation Usage Guide

### For New Developers
1. Start with [TECHNICAL_SNAPSHOT.md](./TECHNICAL_SNAPSHOT.md) - Get the big picture
2. Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Set up your environment
3. Reference [BACKEND_SUMMARY.md](./BACKEND_SUMMARY.md) or [FRONTEND_SUMMARY.md](./FRONTEND_SUMMARY.md) as needed

### For Feature Development
1. Check [BACKEND_SUMMARY.md](./BACKEND_SUMMARY.md) for backend changes
2. Check [FRONTEND_SUMMARY.md](./FRONTEND_SUMMARY.md) for UI changes
3. Use [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for common patterns

### For Debugging
1. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Debugging tips section
2. [BACKEND_SUMMARY.md](./BACKEND_SUMMARY.md) - API flow details
3. [FRONTEND_SUMMARY.md](./FRONTEND_SUMMARY.md) - Component interactions

### For Architecture Decisions
1. [TECHNICAL_SNAPSHOT.md](./TECHNICAL_SNAPSHOT.md) - Current architecture
2. Review specific service summaries for details
3. Check integration points and data flows

---

## 🔑 Key Concepts

### Authentication Flow
JWT-based with role separation (admin/cashier/kitchen). See [BACKEND_SUMMARY.md](./BACKEND_SUMMARY.md#authentication-flow)

### Product-Ingredient System
Many-to-many relationship with quantity tracking. See [BACKEND_SUMMARY.md](./BACKEND_SUMMARY.md#product-management)

### Search Implementation
Global debounced search with case-insensitive matching. See [FRONTEND_SUMMARY.md](./FRONTEND_SUMMARY.md#search-implementation)

### Real-time Updates
Socket.IO for kitchen display synchronization. See [TECHNICAL_SNAPSHOT.md](./TECHNICAL_SNAPSHOT.md#real-time-updates-socketio)

### AI Integration
Backend proxies requests to Python microservice. See [TECHNICAL_SNAPSHOT.md](./TECHNICAL_SNAPSHOT.md#backend--ai-service)

---

## 📊 Statistics

| Metric | Count |
|--------|-------|
| Total Services | 3 |
| Database Models | 26 |
| API Endpoints | 50+ |
| Backend Services | 15 |
| Frontend Services | 9 |
| UI Pages | 5 |
| Lines of Code | ~15,000+ |

---

## 🤝 Contributing

When adding new features:
1. Update the relevant service summary (backend/frontend)
2. Add API endpoints to QUICK_REFERENCE.md
3. Update TECHNICAL_SNAPSHOT.md if architecture changes
4. Document new models in BACKEND_SUMMARY.md

---

## 📞 Support

For questions about:
- **Architecture** → See TECHNICAL_SNAPSHOT.md
- **Backend APIs** → See BACKEND_SUMMARY.md
- **Frontend Components** → See FRONTEND_SUMMARY.md
- **Quick Tasks** → See QUICK_REFERENCE.md

---

**Last Updated:** February 10, 2026  
**Project Status:** Active Development  
**Documentation Version:** 1.0
