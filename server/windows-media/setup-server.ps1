$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $root "server-config.bat"
$tokenPath = Join-Path $root "SEBAS-PLAY-ACCESS-TOKEN.txt"
$mediaPath = Join-Path $root "Peliculas"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "No encuentro Node.js. Instala Node.js LTS desde https://nodejs.org/ y vuelve a ejecutar este archivo." -ForegroundColor Yellow
  Read-Host "Presiona Enter para salir"
  exit 1
}

function New-SecureValue([int]$size) {
  $bytes = New-Object byte[] $size
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return [Convert]::ToBase64String($bytes).Replace("+","-").Replace("/","_").TrimEnd("=")
}

$accessToken = New-SecureValue 32
$signingSecret = New-SecureValue 64
$config = @"
@echo off
set "SEBAS_HOST=0.0.0.0"
set "SEBAS_PORT=8787"
set "SEBAS_MEDIA_ROOT=%~dp0Peliculas"
set "SEBAS_ACCESS_TOKEN=$accessToken"
set "SEBAS_SIGNING_SECRET=$signingSecret"
set "SEBAS_PUBLIC_BASE_URL=http://localhost:8787"
set "SEBAS_URL_TTL_SECONDS=2592000"
set "SEBAS_MAX_UPLOAD_BYTES=21474836480"
"@
Set-Content -Path $configPath -Value $config -Encoding ASCII
$tokenText = "Token para el panel administrador de SEBAS PLAY:" + [Environment]::NewLine + $accessToken + [Environment]::NewLine + [Environment]::NewLine + "Guarda este archivo en privado. No lo publiques ni lo compartas."
Set-Content -Path $tokenPath -Value $tokenText -Encoding UTF8
New-Item -ItemType Directory -Force -Path $mediaPath | Out-Null

Write-Host ""
Write-Host "SEBAS PLAY Media Server preparado." -ForegroundColor Green
Write-Host "1. Copia tus videos a: $mediaPath"
Write-Host "2. Ejecuta start-server.bat"
Write-Host "3. Copia el token desde SEBAS-PLAY-ACCESS-TOKEN.txt al panel administrador."
Write-Host "4. Para acceso remoto, configura un hostname HTTPS estable y cambia SEBAS_PUBLIC_BASE_URL en server-config.bat."
Write-Host ""
Read-Host "Presiona Enter para cerrar"
