# 🔧 Kitchen Dashboard - Quick Troubleshooting Guide

## Current Errors & Solutions

### ❌ Error 1: "Authentication token required"
**Symptom**: Socket.IO connection fails with auth error

**Root Cause**: Token key mismatch - Dashboard was looking for `authToken` but the app stores it as `token`

**Status**: ✅ FIXED - Updated KitchenDashboard.jsx to use `localStorage.getItem('token')`

---

### ❌ Error 2: "500 Internal Server Error on /api/kitchen/orders"
**Symptom**: Backend returns 500 error when fetching kitchen orders

**Root Cause**: Prisma client not regenerated after schema changes. The backend code references `kitchenStation` field but the Prisma client doesn't have it yet.

**Solution**: 
1. **Stop the backend server** (Ctrl+C in the terminal)
2. **Run the restart script**: 
   ```powershell
   cd "c:\My_Works\projects\adani pos"
   .\restart-backend.bat
   ```
   
   OR manually:
   ```powershell
   cd "c:\My_Works\projects\adani pos\restaurant-pos-backend"
   npx prisma generate
   npm run dev
   ```

---

## Quick Fix Steps

### Option 1: Use the Restart Script (Recommended)
1. **In a NEW PowerShell terminal**, run:
   ```powershell
   cd "c:\My_Works\projects\adani pos"
   .\restart-backend.bat
   ```
2. Wait for "Server running on port 3000"
3. Refresh the Kitchen Dashboard in your browser

### Option 2: Manual Restart
1. **Find the terminal running the backend** (usually labeled "node" or "powershell")
2. Press **Ctrl+C** to stop it
3. Run these commands:
   ```powershell
   npx prisma generate
   npm run dev
   ```
4. Wait for "Server running on port 3000"
5. Refresh the Kitchen Dashboard

---

## Verification Checklist

After restarting the backend, verify these in the browser:

### ✅ Socket.IO Connection
1. Open http://localhost:5173/kitchen
2. Press **F12** to open console
3. Look for: `[KDS] Socket.IO connected`
4. Status indicator should show **"Real-time"** with a **green dot**

### ✅ API Response
1. In browser console, check Network tab
2. Find the request: `GET /api/kitchen/orders?station=ALL`
3. Status should be **200 OK** (not 500)
4. Response should contain orders array

### ✅ No Errors
- No red errors in browser console
- No "Authentication token required" messages
- No 500 errors in network tab

---

## If Still Not Working

### Check 1: Token Exists
In browser console, run:
```javascript
console.log('Token:', localStorage.getItem('token'));
```
- Should output a JWT token string
- If `null`, you need to log in first

### Check 2: Backend Running
```powershell
curl http://localhost:3000/api/health
```
- Should return server status
- If connection refused, backend isn't running

### Check 3: Prisma Client Generated
Check if this file exists and is recent:
```
c:\My_Works\projects\adani pos\restaurant-pos-backend\node_modules\.prisma\client\index.d.ts
```
- Should have `kitchenStation` field in Product model
- Should have `kitchenStatus` field in OrderLine model
- Modified date should be today

### Check 4: Database Schema
```powershell
cd "c:\My_Works\projects\adani pos\restaurant-pos-backend"
npx prisma db pull
```
- Should show schema is in sync
- If not, run: `npx prisma db push`

---

## Common Mistakes

### ❌ Wrong: Refreshing browser without restarting backend
The Prisma client is loaded when the server starts. Refreshing the frontend doesn't help.

### ✅ Right: Restart backend, then refresh browser
Backend needs to reload the new Prisma client with updated schema.

### ❌ Wrong: Running `npx prisma generate` while server is running
The server locks the .dll files, preventing regeneration.

### ✅ Right: Stop server first, generate, then start
1. Stop (Ctrl+C)
2. Generate (`npx prisma generate`)
3. Start (`npm run dev`)

---

## Terminal Commands Reference

### Stop Backend
Press **Ctrl+C** in the terminal running the backend

### Regenerate Prisma
```powershell
cd "c:\My_Works\projects\adani pos\restaurant-pos-backend"
npx prisma generate
```

### Start Backend
```powershell
npm run dev
```

### Check Backend Status
```powershell
curl http://localhost:3000/api/health
```

### View Backend Logs
```powershell
# Look for errors in the terminal running npm run dev
```

---

## Expected Behavior After Fix

### Browser Console Should Show:
```
[KDS] Socket.IO connected
```

### Network Tab Should Show:
```
GET /api/kitchen/orders?station=ALL   200 OK
```

### Kitchen Dashboard Should:
- Show "Real-time" status with green dot
- Display any active orders
- Allow station filtering
- Show urgency indicators if items > 5 minutes old

---

## Need More Help?

1. Check the full summary: `KITCHEN_DASHBOARD_SUMMARY.md`
2. Read deployment guide: `DEPLOYMENT_GUIDE.md`
3. Run verification: `node restaurant-pos-backend/verify-kitchen.js`

---

**Last Updated**: After fixing token key mismatch in KitchenDashboard.jsx
**Status**: Waiting for backend restart to complete the fix
