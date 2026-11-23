@echo off
setlocal
cd /d "%~dp0"

if not exist "%~dp0server-config.bat" (
  echo Preparando SEBAS PLAY por primera vez...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-server.ps1" -NonInteractive
  if errorlevel 1 (
    echo No se pudo preparar el servidor. Revisa el mensaje anterior.
    pause
    exit /b 1
  )
)

if not exist "%~dp0server-config.bat" (
  echo No se encontro server-config.bat.
  pause
  exit /b 1
)

call "%~dp0server-config.bat"

if not defined SEBAS_PORT set "SEBAS_PORT=8787"
if not defined SEBAS_MEDIA_ROOT set "SEBAS_MEDIA_ROOT=%~dp0Peliculas"

where node >nul 2>nul
if errorlevel 1 (
  echo No encuentro Node.js. Este servidor necesita Node.js instalado.
  echo Descarga oficial: https://nodejs.org/
  pause
  exit /b 1
)

if not exist "%SEBAS_MEDIA_ROOT%" mkdir "%SEBAS_MEDIA_ROOT%"

rem If the server is already running, do not start a duplicate process.
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:%SEBAS_PORT%/health' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if not errorlevel 1 (
  echo SEBAS PLAY ya esta encendido.
  start "" "http://127.0.0.1:%SEBAS_PORT%/"
  exit /b 0
)

for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.AddressState -eq 'Preferred' } | Select-Object -First 1 -ExpandProperty IPAddress)"`) do set "LAN_IP=%%I"

echo.
echo ==========================================
echo       SEBAS PLAY - SERVIDOR MULTIMEDIA
echo ==========================================
echo Servidor local: http://127.0.0.1:%SEBAS_PORT%/
if defined LAN_IP echo Enlace para tu celular: http://%LAN_IP%:%SEBAS_PORT%/
echo Comprobacion: http://127.0.0.1:%SEBAS_PORT%/health
echo Biblioteca: %SEBAS_MEDIA_ROOT%
echo.

start "SEBAS PLAY Media Server" cmd /k node "%~dp0server.mjs"
rem Fall back to PATH if Node.js is installed in a custom location.
timeout /t 2 /nobreak >nul
powershell -NoProfile -Command "$ready=$false; 1..15 | ForEach-Object { if(-not $ready) { try { $r=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:%SEBAS_PORT%/health' -TimeoutSec 2; if($r.StatusCode -eq 200){$ready=$true} } catch { Start-Sleep -Seconds 1 } } }; if($ready){exit 0}else{exit 1}"
if errorlevel 1 (
  echo No se pudo confirmar que el servidor haya iniciado.
  echo Revisa la ventana "SEBAS PLAY Media Server" para ver el error.
  pause
  exit /b 1
)

echo.
echo SEBAS PLAY esta listo.
if defined LAN_IP echo Abre en el celular: http://%LAN_IP%:%SEBAS_PORT%/
start "" "http://127.0.0.1:%SEBAS_PORT%/"
echo No cierres la ventana del servidor.
pause
