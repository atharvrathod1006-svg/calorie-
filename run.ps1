# PowerShell Launcher for NutriGlance Calorie Tracker
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " NutriGlance Calorie Tracker Full-Stack Starting   " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$pythonBin = "C:\Users\HP\AppData\Local\Programs\Python\Python312\python.exe"
if (-not (Test-Path $pythonBin)) {
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCmd) {
        $pythonBin = $pythonCmd.Source
    } else {
        Write-Error "Python executable not found!"
        exit 1
    }
}

Write-Host "[*] Python executable: $pythonBin" -ForegroundColor Green
Write-Host "[*] Opening browser at http://127.0.0.1:5000" -ForegroundColor Green

Start-Process "http://127.0.0.1:5000"
& $pythonBin backend\app.py
