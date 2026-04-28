@echo off
title SecureFileGuard - Stop All Services
echo.
echo  Stopping all SecureFileGuard services...
echo.

taskkill /F /FI "WINDOWTITLE eq SecureFileGuard - Backend" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq SecureFileGuard - Monitor" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq SecureFileGuard - Frontend" >nul 2>&1

REM Also kill by process name as fallback
taskkill /F /IM python.exe >nul 2>&1
echo  [DONE] Python processes stopped.

echo  [DONE] All SecureFileGuard services stopped.
echo.
pause
