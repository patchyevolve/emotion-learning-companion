# PowerShell script to start both servers
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Starting Emotion-Aware Learning Companion" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $null = Get-Command node -ErrorAction Stop
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Python is installed
try {
    $null = Get-Command python -ErrorAction Stop
} catch {
    Write-Host "[ERROR] Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python from https://www.python.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/3] Starting backend server on port 3000..." -ForegroundColor Green
$backend = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "server" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "[2/3] Starting frontend server on port 8080..." -ForegroundColor Green
$frontend = Start-Process -FilePath "python" -ArgumentList "-m", "http.server", "8080" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "[3/3] Opening browser..." -ForegroundColor Green
Start-Process "http://localhost:8080"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Servers are running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Frontend: http://localhost:8080" -ForegroundColor Yellow
Write-Host " Backend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop servers, close the backend and frontend windows" -ForegroundColor Gray
Write-Host ""

# Keep script running
Write-Host "Press Ctrl+C to exit (servers will keep running)" -ForegroundColor Gray
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "`nShutting down..." -ForegroundColor Yellow
    Stop-Process -Id $backend.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -ErrorAction SilentlyContinue
}

