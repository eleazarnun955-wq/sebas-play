@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "RUNTIME=%~dp0runtime"
set "CLOUDFLARED=%RUNTIME%\cloudflared.exe"
if not exist "%RUNTIME%" mkdir "%RUNTIME%"
if not exist "%CLOUDFLARED%" (
  echo Descargando Cloudflare Tunnel para Windows de 32 bits...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -UseBasicParsing 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-386.exe' -OutFile '%CLOUDFLARED%'"
  if errorlevel 1 (
    echo No se pudo descargar cloudflared. Revisa la conexion a internet.
    pause
    exit /b 1
  )
)
if not exist "%CLOUDFLARED%" (
  echo No se encontro cloudflared.exe.
  pause
  exit /b 1
)
echo.
echo ==========================================================
echo  SEBAS PLAY - ACCESO REMOTO TEMPORAL
echo ==========================================================
echo.
echo IMPORTANTE:
echo - Este archivo inicia el servidor si aun no esta encendido.
echo - Esta direccion es temporal y puede cambiar al reiniciar.
echo - No compartas el enlace publico con personas desconocidas.
echo - No abras el puerto 8787 en el router.
echo.
echo Iniciando el servidor local de SEBAS PLAY...\ncall "%~dp0start-server.bat" --silent\nif errorlevel 1 (\n  echo No se pudo iniciar el servidor local.\n  pause\n  exit /b 1\n)\necho Iniciando tunel HTTPS hacia http://127.0.0.1:8787 ...
echo Cuando aparezca trycloudflare.com, copia esa direccion.
echo Manten esta ventana abierta mientras uses SEBAS PLAY fuera.
echo.
"%CLOUDFLARED%" tunnel --no-autoupdate --url http://127.0.0.1:8787
echo.
echo El tunel se ha detenido.
pause
