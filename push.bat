@echo off
echo ========================================================
echo Pushing NutriGlance Calorie Tracker to GitHub...
echo Repository: https://github.com/atharvrathod1006-svg/calorie-
echo ========================================================
cd /d "%~dp0"
"C:\Program Files\Git\bin\git.exe" push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo SUCCESS! All files have been uploaded to GitHub!
    echo Visit: https://github.com/atharvrathod1006-svg/calorie-
    echo ========================================================
) else (
    echo ========================================================
    echo Push failed. Please check the error above.
    echo ========================================================
)
pause
