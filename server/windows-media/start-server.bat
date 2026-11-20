@echo off
setlocal
cd /d "%~dp0"
if not exist "Peliculas" mkdir "Peliculas"
if not exist "server-config.bat" (
  echo Falta server-config.bat.
  echo Copia server-config.example.bat a server-config.bat y configura tus claves.
  pause
  exit /b 1
)
call server-config.bat
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js no esta instalado. Instala Node.js LTS y vuelve a ejecutar.
  pause
  exit /b 1
)
node server.mjs
pause
