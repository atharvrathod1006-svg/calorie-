@echo off
title NutriGlance Calorie Tracker Server
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
        echo [ERROR] Python not found. Please ensure Python 3.12 is installed.
        pause
        exit /b 1
    )
)

echo [*] Using Python: %PYTHON_BIN%
echo [*] Launching Flask REST API server...
echo.

start "" "http://127.0.0.1:5000"
"%PYTHON_BIN%" backend\app.py
pause
