# Restaurant POS Frontend

## Overview
React + Vite single-page app for the restaurant POS stack. Modules for admin, cashier, and kitchen display (real-time via Socket.IO).

## Stack
- Node.js 18+
- React 19
- Vite 7
- Axios, React Router, Zustand, Recharts
- Socket.IO client
- Tailwind CSS (v4 config)

## Quickstart
1) Install dependencies: `npm install`
2) Create `.env` with `VITE_API_URL=http://localhost:3000` (or deployed API origin)
3) Start dev server: `npm run dev` (opens on Vite default port)
4) Build for prod: `npm run build`; preview with `npm run preview`

## Environment
- `VITE_API_URL` — base origin for API and Socket.IO (defaults to `http://localhost:3000` when missing). The app uses `${VITE_API_URL}/api` for REST and `${VITE_API_URL}` for sockets.

## Scripts
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — serve built assets
- `npm run lint` — ESLint check

## Structure
- `src/config/api.js` — Axios instance with auth token and 401 handling
- `src/pages` — top-level routes (AdminPage, POSPage, KitchenPage, Login, Signup)
- `src/admin` — admin UI (products, categories, floors/tables, reports, settings)
- `src/cashier` — POS cart, tables, order flow
- `src/kitchen` — Kitchen dashboard with WebSocket updates
- `src/services` — API wrappers (floor, kitchen, order, product, etc.)
- `src/store` — global state (auth/session/products/orders)

## Auth & Routing
- Tokens stored in `localStorage` under `token`; attached as `Authorization: Bearer <token>` via Axios interceptor.
- Protected routes handled in `src/routes/ProtectedRoute.jsx`.

## Kitchen Display (real-time)
- Connects to Socket.IO at `VITE_API_URL` with `auth: { token }`.
- Subscribes to events: `kitchen:item:new`, `kitchen:item:update`, `kitchen:order:update`.
- Joins kitchen room via `kitchen:join` (handled in `KitchenDashboard`).

## Notes for Expansion
- Add role-based UI guards and feature flags per module.
- Introduce error boundaries and toast/notification system.
- Add e2e tests (Playwright/Cypress) and component tests.
- Integrate analytics and performance monitoring.
