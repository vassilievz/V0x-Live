$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $root ".tools\livekit"
$exe = Join-Path $binDir "livekit-server.exe"
$config = Join-Path $root "infrastructure\livekit\livekit.local.yaml"

if (-not (Test-Path $exe)) {
  Write-Host "Baixando LiveKit server..."
  New-Item -ItemType Directory -Force -Path $binDir | Out-Null
  $zip = Join-Path $binDir "livekit.zip"
  Invoke-WebRequest -Uri "https://github.com/livekit/livekit/releases/download/v1.13.11/livekit_1.13.11_windows_amd64.zip" -OutFile $zip
  Expand-Archive -Path $zip -DestinationPath $binDir -Force
}

Write-Host "Iniciando LiveKit em ws://localhost:7880"
& $exe --config $config
