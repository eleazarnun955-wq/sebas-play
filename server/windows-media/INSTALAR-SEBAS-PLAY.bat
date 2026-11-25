@echo off
title INSTALADOR SEBAS PLAY
cd /d "%~dp0"
echo ==========================================
echo       INSTALADOR AUTOMATICO SEBAS PLAY
echo ==========================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-server.ps1"
if errorlevel 1 (
  echo.
  echo La instalacion no pudo completarse.
  pause
  exit /b 1
)
echo.
echo El inicio automatico es opcional.
choice /C SN /N /M "Deseas iniciar SEBAS PLAY automaticamente al entrar a Windows? [S/N]: "
if errorlevel 2 goto skip_autostart
if errorlevel 1 (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$root='%~dp0'.TrimEnd('\'); $startup=[Environment]::GetFolderPath('Startup'); $w=New-Object -ComObject WScript.Shell; $s=$w.CreateShortcut((Join-Path $startup 'SEBAS PLAY Servidor.lnk')); $s.TargetPath=$env:ComSpec; $s.Arguments='/c ""'+(Join-Path $root 'start-server.bat')+'" --silent"'; $s.WorkingDirectory=$root; $s.WindowStyle=7; $s.Save()"
  echo Inicio automatico activado.
)
goto start_server
:skip_autostart
echo Inicio automatico omitido. Puedes iniciar el servidor manualmente con start-server.bat.
:start_server
echo.
echo Iniciando servidor...
call "%~dp0start-server.bat"
echo.
echo Instalacion terminada.
pause
