@echo off
title Dung Stock Service
chcp 65001 >nul
echo Dang tat Stock Service (Port 8001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
echo Da tat thanh cong!
timeout /t 2 >nul
