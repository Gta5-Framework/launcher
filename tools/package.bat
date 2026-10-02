@echo off
setlocal
cd /d "%~dp0.."

echo.
echo   Packaging GTA5 Framework Launcher
echo   (produces an installer anyone can run)
echo.

call pnpm tauri build
if errorlevel 1 goto fail

set "bundle_dir=src-tauri\target\release\bundle"

echo.
echo   Packaging succeeded.
echo   Installers are in: %bundle_dir%
echo.

if exist "%bundle_dir%" (
    explorer "%bundle_dir%"
)

pause
exit /b 0

:fail
echo.
echo   Packaging FAILED. See output above.
echo.
pause
exit /b 1
