@echo off
echo.
echo ========================================
echo  Starting Emotion-Aware Learning Companion
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo [1/3] Starting backend server on port 3000...
start "Backend Server" cmd /k "cd server && npm start"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

echo [2/3] Starting frontend server on port 8080...
start "Frontend Server" cmd /k "python -m http.server 8080"

REM Wait a bit more
timeout /t 3 /nobreak >nul

echo [3/3] Opening browser...
start http://localhost:8080

echo.
echo ========================================
echo  Servers are running!
echo ========================================
echo.
echo  Frontend: http://localhost:8080
echo  Backend:  http://localhost:3000
echo.
echo  Press any key to close this window (servers will keep running)
echo  To stop servers, close the "Backend Server" and "Frontend Server" windows
echo.
pause >nul

