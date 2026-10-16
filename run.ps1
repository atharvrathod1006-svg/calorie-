# PowerShell Launcher for NutriGlance Calorie Tracker (Supabase Ready)
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " NutriGlance Calorie Tracker Starting (Supabase)   " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$pythonBin = "C:\Users\HP\AppData\Local\Programs\Python\Python312\python.exe"
if (-not (Test-Path $pythonBin)) {
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCmd) {
        $pythonBin = $pythonCmd.Source
    } else {
        Write-Host "[INFO] Python not found. Opening frontend directly in your default browser..." -ForegroundColor Yellow
        Start-Process "$PSScriptRoot\frontend\index.html"
        exit 0
    }
}

Write-Host "[*] Python executable: $pythonBin" -ForegroundColor Green
Write-Host "[*] Launching local server at http://127.0.0.1:5000" -ForegroundColor Green

Start-Process "http://127.0.0.1:5000"
& $pythonBin -m http.server 5000 --directory "$PSScriptRoot\frontend"
