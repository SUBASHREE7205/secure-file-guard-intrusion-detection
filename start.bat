@echo off
title SecureFileGuard - Startup
color 0A
echo.
echo  =====================================================
echo    SecureFileGuard ^| Enterprise Threat Protection
echo  =====================================================
echo.

REM ── Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

REM ── Check Node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

echo  [1/3] Starting Flask Backend (Port 5000)...
start "SecureFileGuard - Backend" cmd /k "cd /d d:\SecureFileGuard\backend && python app.py"
timeout /t 2 /nobreak >nul

echo  [2/3] Starting File Monitor (Watchdog)...
start "SecureFileGuard - Monitor" cmd /k "cd /d d:\SecureFileGuard\backend && python monitor.py"
timeout /t 2 /nobreak >nul

echo  [3/3] Starting Frontend Dev Server (Port 5173)...
start "SecureFileGuard - Frontend" cmd /k "cd /d d:\SecureFileGuard\frontend\securefileguard-frontend && npm run dev"
timeout /t 4 /nobreak >nul

echo.
echo  =====================================================
echo   All services started!
echo.
echo   Dashboard:  http://localhost:5173
echo   Backend:    http://127.0.0.1:5000
echo   API Health: http://127.0.0.1:5000/api/health
echo  =====================================================
echo.
echo  Opening dashboard in browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo  Press any key to close this window (services keep running)...
pause >nul
