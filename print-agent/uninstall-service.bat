@echo off
cd /d "%~dp0"

net session >nul 2>&1
if %errorLevel% neq 0 (
  echo Asking for administrator permission...
  powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

node uninstall-service.js
echo.
pause
