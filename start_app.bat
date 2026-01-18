@echo off
chcp 65001 >nul
setlocal
title Salon App Launcher
cd /d "%~dp0"

echo ==========================================
echo       نظام صالون غزل للإدارة
echo ==========================================

if not exist "node_modules" (
    echo [معلومات] تم اكتشاف إعداد لأول مرة.
    echo [معلومات] جاري تثبيت الملفات الضرورية... (قد يستغرق بضع دقائق)
    call npm install
    if %errorlevel% neq 0 (
        echo [خطأ] فشل تثبيت الملفات. يرجى التحقق من الاتصال بالإنترنت.
        pause
        exit /b %errorlevel%
    )
    echo [نجاح] تم تثبيت الملفات.
) else (
    echo [معلومات] تم العثور على ملفات النظام.
    echo [معلومات] جاري التحقق السريع من النظام...
    call npm install --prefer-offline --no-audit --no-fund --loglevel error
)

echo.
echo [معلومات] جاري تشغيل الخادم المحلي...
start "Salon Server" /min npm run dev

echo [معلومات] في انتظار تهيئة الخادم...
timeout /t 5 /nobreak >nul

echo [معلومات] جاري تشغيل التطبيق في وضع ملء الشاشة...
start msedge --kiosk http://localhost:5173 --edge-kiosk-type=fullscreen

echo.
echo [نجاح] التطبيق يعمل الآن!
echo يمكنك تصغير هذه النافذة.
echo للخروج من التطبيق، اضغط F11 أو Alt+F4 في المتصفح.
echo.
exit
