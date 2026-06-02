@echo off
echo ===============================================
echo   SwiftWheels Fleet Management System
echo   Created By Yves Ty
echo ===============================================
echo.
echo Starting Backend (port 5000)...
start cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 >nul
echo Starting Frontend (port 3000)...
start cmd /k "cd /d %~dp0frontend && npm start"
echo.
echo Both servers are starting...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
