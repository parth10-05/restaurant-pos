@echo off
echo ========================================
echo Kitchen Dashboard - Backend Restart
echo ========================================
echo.

echo [1/3] Stopping any existing backend processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Regenerating Prisma Client with new schema...
cd /d "c:\My_Works\projects\adani pos\restaurant-pos-backend"
call npx prisma generate

echo.
echo [3/3] Starting backend server...
echo.
echo Press Ctrl+C to stop the server
echo ========================================
call npm run dev
