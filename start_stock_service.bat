@echo off
title Auto-DCF Stock Data Backend (Vietnam Stocks)
chcp 65001 >nul
echo ============================================================
echo   Khoi dong Backend lay du lieu co phieu Viet Nam...
echo ============================================================
py -3.11 stock_service.py
if %ERRORLEVEL% NEQ 0 (
    python stock_service.py
)
pause
