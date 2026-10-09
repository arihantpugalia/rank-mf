@echo off
TITLE Mutual Fund Screener
echo =======================================================
echo Starting Mutual Fund Screener Application...
echo =======================================================

:: Start the FastAPI backend in a separate command window
echo [1/2] Starting Backend Server (FastAPI on port 8000)...
start "Screener Backend" cmd /c "cd backend && python -m uvicorn main:app --port 8000 --reload"

:: Start the Next.js frontend in the current window
echo [2/2] Starting Frontend Server (Next.js on port 3000)...
cd frontend
npm run dev
