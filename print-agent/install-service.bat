@echo off
cd /d "%~dp0"

REM Installing a Windows service needs administrator rights. If we don't have
REM them, relaunch this same file elevated instead of failing with a confusing
REM permissions error.
net session >nul 2>&1
if %errorLevel% neq 0 (
  echo Asking for administrator permission...
  powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

node install-service.js
echo.
pause
