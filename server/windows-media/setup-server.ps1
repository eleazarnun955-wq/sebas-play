param([switch]$NonInteractive)
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
set "SEBAS_PUBLIC_BASE_URL="
set "SEBAS_URL_TTL_SECONDS=2592000"
set "SEBAS_MAX_UPLOAD_BYTES=21474836480"
"@
Set-Content -Path $configPath -Value $config -Encoding ASCII
$tokenText = "Token para el panel administrador de SEBAS PLAY:" + [Environment]::NewLine + $accessToken + [Environment]::NewLine + [Environment]::NewLine + "Guarda este archivo en privado. No lo publiques ni lo compartas."
Set-Content -Path $tokenPath -Value $tokenText -Encoding UTF8
New-Item -ItemType Directory -Force -Path $mediaPath | Out-Null

Write-Host ""
try {
  $ruleName = "SEBAS PLAY Media Server TCP 8787"
  $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
  if (-not $existingRule) {
    $firewallCommand = "New-NetFirewallRule -DisplayName '$ruleName' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8787 -Profile Private"
    try {
      Start-Process -FilePath "powershell.exe" -Verb RunAs -Wait -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $firewallCommand) -ErrorAction Stop | Out-Null
      Write-Host "Regla de Firewall creada para la red privada." -ForegroundColor Green
    } catch {
      Write-Warning "No se pudo autorizar automáticamente el Firewall. La conexión desde el celular podría requerir permitir Node.js en Windows Defender Firewall."
    }
  }
} catch {
  Write-Warning "No se pudo comprobar el Firewall de Windows. Continuaremos con la instalación."
}

Write-Host ""
Write-Host "SEBAS PLAY Media Server preparado." -ForegroundColor Green
Write-Host "1. Copia tus videos a: $mediaPath"
Write-Host "2. Ejecuta start-server.bat"
Write-Host "3. Copia el token desde SEBAS-PLAY-ACCESS-TOKEN.txt al panel administrador."
Write-Host "4. En tu red local, los enlaces de reproducción usan automáticamente la dirección con la que se conecte el dispositivo." 
Write-Host "5. Para acceso remoto, configura un hostname HTTPS estable y coloca esa URL en SEBAS_PUBLIC_BASE_URL dentro de server-config.bat."
Write-Host ""
if (-not $NonInteractive) { Read-Host "Presiona Enter para cerrar" }
