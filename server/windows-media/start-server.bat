@echo off
setlocal
cd /d "%~dp0"
set "SILENT=%~1"

if not exist "%~dp0server-config.bat" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-server.ps1" -NonInteractive
  if errorlevel 1 exit /b 1
)
call "%~dp0server-config.bat"
if not defined SEBAS_PORT set "SEBAS_PORT=8787"

set "NODE_EXE=%~dp0runtime\node.exe"
if not exist "%NODE_EXE%" (
  set "NODE_EXE="
  for /f "delims=" %%N in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%N"
)
if not defined NODE_EXE (
  echo No se encuentra el motor Node.js. Ejecuta INSTALAR-SEBAS-PLAY.bat.
  if /i not "%SILENT%"=="--silent" pause
  exit /b 1
)

powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:%SEBAS_PORT%/health' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if not errorlevel 1 (
  if /i not "%SILENT%"=="--silent" start "" "http://127.0.0.1:%SEBAS_PORT%/"
  exit /b 0
)

start "SEBAS PLAY Media Server" /min "%NODE_EXE%" "%~dp0server.mjs"
timeout /t 3 /nobreak >nul
powershell -NoProfile -Command "$ready=$false; 1..20 | ForEach-Object { if(-not $ready) { try { $r=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:%SEBAS_PORT%/health' -TimeoutSec 2; if($r.StatusCode -eq 200){$ready=$true} } catch { Start-Sleep -Seconds 1 } } }; if($ready){exit 0}else{exit 1}"
if errorlevel 1 (
  echo No se pudo iniciar el servidor. Revisa la carpeta runtime y server-config.bat.
  if /i not "%SILENT%"=="--silent" pause
  exit /b 1
)

for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue ^| Where-Object { $_.IPAddress -notlike '127.*' -and $_.AddressState -eq 'Preferred' } ^| Select-Object -First 1 -ExpandProperty IPAddress)"`) do set "LAN_IP=%%I"
if /i not "%SILENT%"=="--silent" (
  echo SEBAS PLAY está activo.
  if defined LAN_IP echo Enlace para Android y Roku: http://%LAN_IP%:%SEBAS_PORT%/
  echo Token privado: %~dp0SEBAS-PLAY-ACCESS-TOKEN.txt
  start "" "http://127.0.0.1:%SEBAS_PORT%/"
  pause
)
exit /b 0
