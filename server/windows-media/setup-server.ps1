param([switch]$NonInteractive)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $root "server-config.bat"
$tokenPath = Join-Path $root "SEBAS-PLAY-ACCESS-TOKEN.txt"
$runtimeDir = Join-Path $root "runtime"
$nodePath = Join-Path $runtimeDir "node.exe"
$defaultMediaPath = Join-Path $root "Peliculas"

function New-SecureValue([int]$size) {
  $bytes = New-Object byte[] $size
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return [Convert]::ToBase64String($bytes).Replace("+","-").Replace("/","_").TrimEnd("=")
}

# Use the official 32-bit Node.js 22 LTS binary. It stays inside this folder;
# no system-wide Node.js installation or Windows reinstall is required.
if (-not (Test-Path $nodePath)) {
  New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
  $version = "v22.23.5"
  $baseUrl = "https://nodejs.org/dist/$version"
  $binaryUrl = "$baseUrl/win-x86/node.exe"
  $checksumsUrl = "$baseUrl/SHASUMS256.txt"
  $tempNode = Join-Path $runtimeDir "node.exe.download"
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Write-Host "Descargando el motor compatible con Windows de 32 bits..." -ForegroundColor Cyan
    Invoke-WebRequest -UseBasicParsing -Uri $binaryUrl -OutFile $tempNode
    $sumFile = Join-Path $runtimeDir "SHASUMS256.txt"
    Invoke-WebRequest -UseBasicParsing -Uri $checksumsUrl -OutFile $sumFile
    $line = Get-Content $sumFile | Where-Object { $_ -match '\swin-x86/node\.exe$' } | Select-Object -First 1
    if (-not $line) { throw "No se encontró la suma oficial de verificación de Node.js." }
    $expected = ($line -split '\s+')[0].ToLowerInvariant()
    $actual = (Get-FileHash -Algorithm SHA256 -Path $tempNode).Hash.ToLowerInvariant()
    if ($actual -ne $expected) { throw "La verificación SHA-256 de Node.js no coincide." }
    Move-Item -Force $tempNode $nodePath
    Remove-Item $sumFile -Force -ErrorAction SilentlyContinue
    Write-Host "Motor Node.js 32 bits instalado y verificado." -ForegroundColor Green
  } catch {
    Remove-Item $tempNode -Force -ErrorAction SilentlyContinue
    Write-Host "No se pudo descargar/verificar Node.js: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Conecta la laptop a internet e intenta ejecutar INSTALAR-SEBAS-PLAY.bat otra vez."
    if (-not $NonInteractive) { Read-Host "Presiona Enter para salir" }
    exit 1
  }
}

if (-not (Test-Path $configPath)) {
  $mediaPath = $defaultMediaPath
  if (-not $NonInteractive) {
    try {
      Add-Type -AssemblyName System.Windows.Forms
      $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
      $dialog.Description = "Selecciona la carpeta principal donde guardas tus películas y series. Se revisarán también sus subcarpetas."
      $dialog.ShowNewFolderButton = $true
      if (Test-Path (Join-Path $env:USERPROFILE "Videos")) { $dialog.SelectedPath = Join-Path $env:USERPROFILE "Videos" }
      if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK -and $dialog.SelectedPath) {
        $mediaPath = $dialog.SelectedPath
      }
    } catch { $mediaPath = $defaultMediaPath }
  }
  New-Item -ItemType Directory -Force -Path $mediaPath | Out-Null
  $accessToken = New-SecureValue 32
  $signingSecret = New-SecureValue 64
  $config = @"
@echo off
set "SEBAS_HOST=0.0.0.0"
set "SEBAS_PORT=8787"
set "SEBAS_MEDIA_ROOT=$mediaPath"
set "SEBAS_ACCESS_TOKEN=$accessToken"
set "SEBAS_SIGNING_SECRET=$signingSecret"
set "SEBAS_PUBLIC_BASE_URL="
set "SEBAS_URL_TTL_SECONDS=2592000"
set "SEBAS_MAX_UPLOAD_BYTES=21474836480"
"@
  Set-Content -Path $configPath -Value $config -Encoding Default
  $tokenText = "Token para el panel administrador de SEBAS PLAY:" + [Environment]::NewLine + $accessToken + [Environment]::NewLine + [Environment]::NewLine + "Guarda este archivo en privado. No lo publiques ni lo compartas."
  Set-Content -Path $tokenPath -Value $tokenText -Encoding UTF8
  Write-Host "Configuración privada creada." -ForegroundColor Green
} elseif (-not (Test-Path $tokenPath)) {
  $configText = Get-Content -Path $configPath -Raw
  $match = [regex]::Match($configText, '(?m)^set "SEBAS_ACCESS_TOKEN=(.+)"$')
  if ($match.Success) {
    $tokenText = "Token para el panel administrador de SEBAS PLAY:" + [Environment]::NewLine + $match.Groups[1].Value + [Environment]::NewLine + [Environment]::NewLine + "Guarda este archivo en privado. No lo publiques ni lo compartas."
    Set-Content -Path $tokenPath -Value $tokenText -Encoding UTF8
  }
}

New-Item -ItemType Directory -Force -Path $defaultMediaPath | Out-Null
try {
  $ruleName = "SEBAS PLAY Media Server TCP 8787"
  if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
    $cmd = "New-NetFirewallRule -DisplayName '$ruleName' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8787 -Profile Private"
    try {
      Start-Process -FilePath "powershell.exe" -Verb RunAs -Wait -ArgumentList @("-NoProfile","-ExecutionPolicy","Bypass","-Command",$cmd) -ErrorAction Stop | Out-Null
    } catch { Write-Warning "Windows no autorizó el Firewall. Se puede permitir después desde Seguridad de Windows." }
  }
} catch { Write-Warning "No se pudo configurar automáticamente el Firewall." }

Write-Host ""
Write-Host "SEBAS PLAY está preparado." -ForegroundColor Green
Write-Host "Carpeta de biblioteca: revisa server-config.bat para ver la ruta elegida."
Write-Host "Token privado: $tokenPath"
Write-Host "Motor local: $nodePath"
if (-not $NonInteractive) { Read-Host "Presiona Enter para continuar" }
