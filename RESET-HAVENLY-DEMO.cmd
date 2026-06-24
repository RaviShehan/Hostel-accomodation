@echo off
title Reset Havenly Demo Data
cd /d "%~dp0outputs"
node scripts\reset-data.js
echo.
echo Demo data has been reset.
echo Restart Havenly to recreate the clean sample database.
echo.
pause

