@echo off
title SafeRoute Full-Stack Launcher
echo ========================================================
echo        SafeRoute Full-Stack Daily Launcher
echo ========================================================
echo.

echo [1/3] Starting AI FastAPI Engine on port 8000...
start "SafeRoute AI Service (Port 8000)" cmd /k "cd /d %~dp0ai && .\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000"

echo [2/3] Starting Backend API Gateway on port 5000...
start "SafeRoute Backend Gateway (Port 5000)" cmd /k "cd /d %~dp0backend && npm run dev"

echo [3/3] Starting Frontend React UI on port 5173...
start "SafeRoute Frontend UI (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo ========================================================
echo   SafeRoute is connected and running!
echo   Frontend:  http://localhost:5173
echo   Admin:     http://localhost:5173/admin
echo   Backend:   http://localhost:5000/api/health
echo   AI Docs:   http://127.0.0.1:8000/docs
echo ========================================================
echo.
echo Launching SafeRoute in your default browser...
start http://localhost:5173
