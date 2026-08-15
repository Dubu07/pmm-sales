@echo off
setlocal
cd /d "%~dp0"

echo Installing dependencies...
call npm install
if errorlevel 1 goto :error

echo Applying the local D1 database migration...
call npm run db:local:apply
if errorlevel 1 goto :error

echo.
echo Setup complete.
echo Run start.bat to start local development.
pause
exit /b 0

:error
echo.
echo Setup failed. Review the error above.
pause
exit /b 1
