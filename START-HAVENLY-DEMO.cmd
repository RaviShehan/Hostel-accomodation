@echo off
title Havenly Demo Launcher
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js was not found on this computer.
  echo Install Node.js 20 or newer from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

echo Starting Havenly at http://localhost:4173 ...
start "Havenly Server - keep this window open" cmd /k "cd /d ""%~dp0outputs"" && node server.js"
timeout /t 3 /nobreak >nul
start "" "http://localhost:4173"
exit /b 0

