@echo off
echo Starting Internship Recommendation System
echo ==========================================
echo.

echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and add it to your PATH
    pause
    exit /b 1
)
echo ✓ Python found

echo.
echo Starting ML Backend...
cd Module-B\ ML
start "ML Backend" cmd /k "python start_ml_backend.py"
cd ..

echo.
echo Waiting for ML Backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo Starting Frontend...
cd Module-C-UI-UX\my-app

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js and add it to your PATH
    pause
    exit /b 1
)
echo ✓ Node.js found

echo.
echo Installing frontend dependencies if needed...
if not exist node_modules (
    echo Installing npm packages...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install npm packages
        pause
        exit /b 1
    )
)

echo.
echo Setting up database...
npx prisma generate
npx prisma db push

echo.
echo Starting Next.js development server...
npm run dev

pause
