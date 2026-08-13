@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Dependencies are not installed. Run setup.bat first.
  pause
  exit /b 1
)
start "" http://localhost:3000
call npm run dev
