@echo off
title SEBAS PLAY - Quitar inicio automatico
echo ==========================================
echo     SEBAS PLAY - INICIO AUTOMATICO
echo ==========================================
echo.
echo Esto solo quitara el acceso directo de inicio automatico.
echo NO borra peliculas, configuracion, claves ni aplicaciones.
echo El servidor seguira funcionando hasta que cierres su ventana.
echo.
choice /C SN /N /M "Deseas quitar el inicio automatico? [S/N]: "
if errorlevel 2 exit /b 0
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$startup=[Environment]::GetFolderPath('Startup'); $shortcut=Join-Path $startup 'SEBAS PLAY Servidor.lnk'; if(Test-Path $shortcut){Remove-Item -LiteralPath $shortcut -Force}; Write-Host 'Inicio automatico desactivado.' -ForegroundColor Green"
echo.
pause
