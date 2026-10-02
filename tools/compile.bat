@echo off
setlocal
cd /d "%~dp0.."

echo.
echo   Compiling GTA5 Framework Launcher
echo.

echo.
echo > Frontend (tsc + vite build)
call pnpm build
if errorlevel 1 goto fail

echo.
echo > Backend (cargo build --release)
pushd src-tauri
call cargo build --release
set "cargo_result=%errorlevel%"
popd
if not "%cargo_result%"=="0" goto fail

echo.
echo   Compile succeeded.
echo   Frontend output: dist\
echo   Backend binary:  src-tauri\target\release\
echo.
pause
exit /b 0

:fail
echo.
echo   Compile FAILED. See output above.
echo.
pause
exit /b 1
