@echo off
REM 🚀 Quick Setup Script - The Senses Test Flow (Windows)

echo.
echo ==========================================
echo 🧠 The Senses - Quick Setup
echo ==========================================
echo.

REM Check Node.js
echo ✓ Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js from https://nodejs.org
    exit /b 1
)

echo ✓ Node.js found: 
node --version

echo.
echo ==========================================
echo 📦 Installing Dependencies
echo ==========================================
echo.

REM Backend dependencies
echo 📚 Installing Backend dependencies...
cd Backend
call npm install
if errorlevel 1 (
    echo ❌ Backend installation failed
    exit /b 1
)
echo ✅ Backend dependencies installed

REM Frontend dependencies
echo 📚 Installing Frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo ❌ Frontend installation failed
    exit /b 1
)
echo ✅ Frontend dependencies installed

echo.
echo ==========================================
echo 🌱 Seeding Database
echo ==========================================
echo.

cd ..\Backend
node seed\seedQuestions.js
if errorlevel 1 (
    echo ⚠️ Question seeding had issues
)

echo.
echo ==========================================
echo ✅ Setup Complete!
echo ==========================================
echo.
echo 📝 Next Steps:
echo.
echo Terminal 1 - Start Backend:
echo   cd Backend
echo   npm start
echo   (Will run on http://localhost:5000)
echo.
echo Terminal 2 - Start Frontend:
echo   cd frontend
echo   npm run dev
echo   (Will run on http://localhost:5173)
echo.
echo 🌐 Then visit: http://localhost:5173
echo.
echo ==========================================
echo.
pause
