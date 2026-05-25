# SSH fuer GitHub einrichten (repository-next)
# Ausfuehren: powershell -ExecutionPolicy Bypass -File .\scripts\git-ssh-setup.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

$keyPath = "$env:USERPROFILE\.ssh\id_ed25519"
$pubPath = "$keyPath.pub"

Write-Host "=== SSH-Setup fuer GitHub ===" -ForegroundColor Cyan

if (-not (Test-Path $pubPath)) {
  New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.ssh" | Out-Null
  Write-Host "Erzeuge neuen Schluessel (ohne Passphrase)..." -ForegroundColor Yellow
  ssh-keygen -t ed25519 -C "frank@frankpohlmann.de" -f $keyPath -N '""'
}

# ssh-agent (Windows)
$agent = Get-Service ssh-agent -ErrorAction SilentlyContinue
if ($agent) {
  if ($agent.Status -ne "Running") {
    Set-Service ssh-agent -StartupType Automatic
    Start-Service ssh-agent
  }
  ssh-add $keyPath 2>$null
}

Write-Host ""
Write-Host "Oeffentlicher Schluessel (fuer GitHub kopieren):" -ForegroundColor Green
Write-Host "----------------------------------------"
Get-Content $pubPath
Write-Host "----------------------------------------"
Write-Host ""
Write-Host "1. Browser: https://github.com/settings/ssh/new"
Write-Host "   Title: z.B. Windows-PC oder XAMPP"
Write-Host "   Key: komplette Zeile oben einfuegen -> Add SSH key"
Write-Host ""
Write-Host "2. Verbindung testen (nach Schritt 1):"
Write-Host "   ssh -T git@github.com"
Write-Host "   Erwartung: 'Hi FranksZeug! ...'"
Write-Host ""

git remote set-url origin git@github.com:FranksZeug/repository-next.git
Write-Host "Remote auf SSH umgestellt:" -ForegroundColor Green
git remote -v

Write-Host ""
Write-Host "3. Push (wenn Repo auf GitHub existiert und committed):"
Write-Host "   git push -u origin main"
