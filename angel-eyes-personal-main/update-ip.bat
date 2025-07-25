@echo off
echo Getting current IP address...

REM Get the current IP address
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| find "IPv4 Address"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set currentip=%%j
        goto :found
    )
)

:found
set currentip=%currentip: =%
echo Found IP: %currentip%

REM Update the API file
echo Updating API configuration...
powershell -Command "(Get-Content 'frontend\services\api.js') -replace 'http://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:5000/api', 'http://%currentip%:5000/api' | Set-Content 'frontend\services\api.js'"
powershell -Command "(Get-Content 'frontend\services\api.js') -replace 'http://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:5000', 'http://%currentip%:5000' | Set-Content 'frontend\services\api.js'"

echo ✅ API updated to use IP: %currentip%
echo 🚀 Now restart your frontend server!
pause
