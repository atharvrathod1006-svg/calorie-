@echo off
title NutriGlance Calorie Tracker (Supabase Ready)
echo ===================================================
echo     Starting NutriGlance Calorie Tracker
echo ===================================================
echo.

set PYTHON_BIN=C:\Users\HP\AppData\Local\Programs\Python\Python312\python.exe

if not exist "%PYTHON_BIN%" (
    where python >nul 2>&1
    if %errorlevel% equ 0 (
        set PYTHON_BIN=python
    ) else (
        echo [INFO] Python not found. Opening frontend directly in your default browser...
        start "" "%~dp0frontend\index.html"
        exit /b 0
    )
)

echo [*] Using Python: %PYTHON_BIN%
echo [*] Launching local server at http://127.0.0.1:5000...
echo.

start "" "http://127.0.0.1:5000"
"%PYTHON_BIN%" -m http.server 5000 --directory "%~dp0frontend"
pause
