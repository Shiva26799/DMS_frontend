@echo off
REM =============================================================================
REM LOVOL DMS - Quick Setup Script (Windows)
REM =============================================================================
REM Run this script to verify and start your development environment
REM Usage: Double-click SETUP.bat or run: SETUP.bat
REM =============================================================================

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                    LOVOL DMS - Quick Setup                       ║
echo ║          Distribution Management System Setup Script             ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
echo 🔍 Checking Node.js version...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js is installed: %NODE_VERSION%
) else (
    echo ❌ Node.js is not installed. Please install Node.js v18+ from https://nodejs.org
    pause
    exit /b 1
)

echo.

REM Check pnpm
echo 🔍 Checking pnpm...
where pnpm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
    echo ✅ pnpm is installed: v%PNPM_VERSION%
) else (
    echo ⚠️  pnpm is not installed. Installing pnpm globally...
    call npm install -g pnpm
    if %ERRORLEVEL% EQU 0 (
        echo ✅ pnpm installed successfully!
    ) else (
        echo ❌ Failed to install pnpm. Please run: npm install -g pnpm
        pause
        exit /b 1
    )
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Install dependencies
echo 📦 Installing dependencies...
echo ⏱️  This may take 1-2 minutes...
echo.

call pnpm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Dependencies installed successfully!
) else (
    echo.
    echo ❌ Failed to install dependencies. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Display next steps
echo ✨ Setup Complete! ✨
echo.
echo 🚀 To start the development server, run:
echo.
echo    pnpm run dev
echo.
echo 📖 Then open your browser and navigate to:
echo    http://localhost:5173
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📚 Documentation:
echo    • Quick Start:        QUICKSTART.md
echo    • Full Documentation: README.md
echo    • Setup Checklist:    SETUP-CHECKLIST.md
echo    • System Overview:    SYSTEM-OVERVIEW.md
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 🎯 What's Included:
echo    ✓ 8 Core Modules (Dashboard, Leads, Dealers, Products, Orders, etc.)
echo    ✓ 14 Page Components
echo    ✓ 50+ UI Components
echo    ✓ Complete Mock Data
echo    ✓ Responsive Design
echo    ✓ Enterprise-Grade UI
echo.
echo Happy Coding! 🎉
echo.
echo Press any key to exit...
pause >nul
