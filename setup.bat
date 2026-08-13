@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo PMM Sales and Invoice System - First Setup
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 22 LTS or newer, then run setup.bat again.
  pause
  exit /b 1
)

if not exist data mkdir data
if not exist data\backups mkdir data\backups

if exist data\pmm-sales.db (
  echo Existing database detected. Creating pre-setup backup...
  copy /Y data\pmm-sales.db data\backups\pre-setup-backup.db >nul
)

echo Installing packages...
call npm install
if errorlevel 1 goto :error

echo Generating Prisma client and creating SQLite schema...
call npm run setup
if errorlevel 1 goto :error

echo.
echo Setup completed successfully.
echo Run start.bat to launch the application.
pause
exit /b 0

:error
echo.
echo Setup failed. Review the error above.
pause
exit /b 1
