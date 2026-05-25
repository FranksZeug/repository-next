# Produktions-Paket fuer anderen Server erstellen
# Ausfuehren: powershell -ExecutionPolicy Bypass -File .\scripts\package-deploy.ps1
#
# Ergebnis: Ordner deploy/iab-repository/ (zum Kopieren/Zippen)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

$OutDir = Join-Path $RepoRoot "deploy\iab-repository"

Write-Host "Build (standalone)..." -ForegroundColor Cyan
$env:NEXT_TELEMETRY_DISABLED = "1"
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build fehlgeschlagen" }

if (-not (Test-Path ".next\standalone\server.js")) {
  throw "Kein standalone-Build gefunden. next.config.ts muss output: 'standalone' haben."
}

Write-Host "Paket zusammenstellen: $OutDir" -ForegroundColor Cyan
if (Test-Path $OutDir) { Remove-Item $OutDir -Recurse -Force }
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

# Standalone-App (enthaelt minimale node_modules)
Copy-Item -Path ".next\standalone\*" -Destination $OutDir -Recurse -Force

# Statische Assets (nicht im standalone enthalten)
$staticDest = Join-Path $OutDir ".next\static"
New-Item -ItemType Directory -Path $staticDest -Force | Out-Null
Copy-Item -Path ".next\static\*" -Destination $staticDest -Recurse -Force

# public (OpenAPI, etc.)
if (Test-Path "public") {
  Copy-Item -Path "public" -Destination (Join-Path $OutDir "public") -Recurse -Force
}

Copy-Item ".env.example" (Join-Path $OutDir ".env.example") -Force

@'
#!/bin/sh
# Start auf Linux-Server (Node 20+)
cd "$(dirname "$0")"
if [ ! -f .env.local ] && [ -f .env.example ]; then
  echo "Hinweis: .env.local anlegen (cp .env.example .env.local) und SESSION_SECRET setzen."
fi
export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT=${PORT:-3000}
exec node server.js
'@ | Set-Content -Path (Join-Path $OutDir "start.sh") -Encoding UTF8

@'
@echo off
cd /d "%~dp0"
if not exist .env.local (
  echo Hinweis: .env.local anlegen und SESSION_SECRET setzen.
)
set NODE_ENV=production
set HOSTNAME=0.0.0.0
set PORT=3000
node server.js
'@ | Set-Content -Path (Join-Path $OutDir "start.bat") -Encoding ASCII

$readme = @"
IAB Repository Service – Produktionspaket
=========================================

Voraussetzung auf dem Zielserver: Node.js 20 oder neuer (https://nodejs.org)

1. Diesen Ordner auf den Server kopieren (z.B. /opt/iab-repository)
2. Konfiguration:
   cp .env.example .env.local
   # .env.local bearbeiten: SESSION_SECRET (mind. 32 Zeichen), DATAHUB_*
3. Start:
   Linux:   chmod +x start.sh && ./start.sh
   Windows: start.bat
   Oder:    node server.js

App laeuft auf Port 3000 (PORT-Umgebungsvariable aendern).

Hinter Nginx/Apache als Reverse-Proxy z.B.:
  ProxyPass / http://127.0.0.1:3000/

Nicht noetig auf dem Server: npm install, npm run build, Quellcode.
"@

Set-Content -Path (Join-Path $OutDir "DEPLOY.txt") -Value $readme -Encoding UTF8

$zipPath = Join-Path $RepoRoot "deploy\iab-repository.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path $OutDir -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "Fertig." -ForegroundColor Green
Write-Host "  Ordner: $OutDir"
Write-Host "  ZIP:    $zipPath"
Write-Host ""
Write-Host "Auf den Server kopieren, .env.local anlegen, start.sh ausfuehren."
