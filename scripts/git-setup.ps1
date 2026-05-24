# Einmalige Git-Konfiguration für dieses Repository (repository-next)
# Ausführen:  cd repository-next
#             powershell -ExecutionPolicy Bypass -File .\scripts\git-setup.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

Write-Host "Repository: $RepoRoot" -ForegroundColor Cyan

# Nur lokale Einstellungen (nicht global)
git config --local user.name "FranksZeug"
git config --local user.email "frank@frankpohlmann.de"
git config --local credential.helper manager
git config --local init.defaultBranch main

Write-Host ""
Write-Host "Lokale Git-Konfiguration:" -ForegroundColor Green
git config --local --list | Select-String "user\.|credential\.|init\."

$remote = git remote get-url origin 2>$null
if (-not $remote) {
  git remote add origin "https://github.com/FranksZeug/repository-next.git"
  Write-Host ""
  Write-Host "Remote 'origin' gesetzt: https://github.com/FranksZeug/repository-next.git" -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "Remote 'origin' existiert bereits: $remote" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Nächste Schritte:" -ForegroundColor Cyan
Write-Host "  1. Auf GitHub ein LEERES Repository anlegen: FranksZeug/repository-next"
Write-Host "     (ohne README, ohne .gitignore – die Dateien liegen schon lokal)"
Write-Host "  2. Personal Access Token (PAT) erstellen:"
Write-Host "     GitHub -> Settings -> Developer settings -> Personal access tokens"
Write-Host "     Berechtigung: repo (voller Zugriff auf private Repositories)"
Write-Host "  3. Commit und Push:"
Write-Host "     git add -A"
Write-Host "     git commit -m `"IAB Repository Service (Next.js)`""
Write-Host "     git branch -M main"
Write-Host "     git push -u origin main"
Write-Host ""
Write-Host "Beim ersten Push: Benutzername = FranksZeug"
Write-Host "Passwort-Feld     = Ihr PAT (nicht Ihr GitHub-Kontopasswort!)"
Write-Host "Windows speichert den Token danach im Credential Manager."
