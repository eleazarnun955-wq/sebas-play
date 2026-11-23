@echo off
setlocal
cd /d "%~dp0"

rem Prepare secure keys and the Peliculas folder automatically on first run.
if not exist "%~dp0server-config.bat" (
  echo Preparando SEBAS PLAY por primera vez...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-server.ps1"
  if errorlevel 1 (
    echo No se pudo preparar el servidor.
    pause
    exit /b 1
  )
)

if not exist "%~dp0server-config.bat" (
  echo No se encontro server-config.bat. Ejecuta nuevamente este archivo.
  pause
  exit /b 1
)

call "%~dp0server-config.bat"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js no esta instalado. Instala Node.js LTS compatible con Windows de 32 bits.
  echo Descarga: https://nodejs.org/
  pause
  exit /b 1
)

for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.AddressState -eq 'Preferred' } | Select-Object -First 1 -ExpandProperty IPAddress)"`) do set "LAN_IP=%%I"

echo.
echo ==========================================
echo       SEBAS PLAY - SERVIDOR MULTIMEDIA
echo ==========================================
echo Servidor local: http://127.0.0.1:%SEBAS_PORT%/
if defined LAN_IP echo Enlace para tu celular: http://%LAN_IP%:%SEBAS_PORT%/
echo Comprobacion: http://127.0.0.1:%SEBAS_PORT%/health
echo Biblioteca: %SEBAS_MEDIA_ROOT%
echo.
echo Abriendo el servidor en una ventana independiente...
start "SEBAS PLAY Media Server" node "%~dp0server.mjs"
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:%SEBAS_PORT%/"
echo.
echo Deja abierta la ventana "SEBAS PLAY Media Server".
echo Cuando veas "SERVIDOR ACTIVO" en el navegador, el servidor esta listo.
echo.
pause
