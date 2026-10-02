@echo off
setlocal
cd /d "%~dp0.."

:menu
cls
echo.
echo   GTA5 Framework Launcher - Dev Tools
echo.
echo   1. Start full app (pnpm tauri dev)
echo   2. Start frontend only (vite, browser at localhost:1420)
echo   3. Type-check frontend (tsc --noEmit)
echo   4. Check Rust backend (cargo check)
echo   5. Install / update dependencies (pnpm install)
echo   6. Clean Rust build cache (cargo clean)
echo   7. Exit
echo.
set "choice="
set /p choice="Select an option: "

if "%choice%"=="1" goto run_dev
if "%choice%"=="2" goto run_vite
if "%choice%"=="3" goto run_tsc
if "%choice%"=="4" goto run_cargo_check
if "%choice%"=="5" goto run_install
if "%choice%"=="6" goto run_cargo_clean
if "%choice%"=="7" goto end
goto menu

:run_dev
call pnpm tauri dev
goto end

:run_vite
call pnpm dev
goto end

:run_tsc
call npx tsc --noEmit
echo.
pause
goto menu

:run_cargo_check
pushd src-tauri
call cargo check
popd
echo.
pause
goto menu

:run_install
call pnpm install
echo.
pause
goto menu

:run_cargo_clean
pushd src-tauri
call cargo clean
popd
echo.
echo Rust build cache cleared.
pause
goto menu

:end
endlocal
