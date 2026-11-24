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
echo Configurando inicio automatico de Windows...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$root='%~dp0'.TrimEnd('\'); $startup=[Environment]::GetFolderPath('Startup'); $w=New-Object -ComObject WScript.Shell; $s=$w.CreateShortcut((Join-Path $startup 'SEBAS PLAY Servidor.lnk')); $s.TargetPath=$env:ComSpec; $s.Arguments='/c ""'+(Join-Path $root 'start-server.bat')+'"" --silent'; $s.WorkingDirectory=$root; $s.WindowStyle=7; $s.Save()"
echo.
echo Iniciando servidor...
call "%~dp0start-server.bat"
echo.
echo Instalacion terminada. La laptop iniciara SEBAS PLAY al entrar a Windows.
pause
