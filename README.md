# IAB Repository Service (Next.js)

Eigenständige Produktions-Variante des **IAB-Backend-Repository-Service** mit:

- **Next.js App Router** (UI + API in einem Prozess/Container)
- **BFF-Proxy** zum DataHub – API-Passwort und Token nur serverseitig (HttpOnly-Session)
- Integrierte **Hilfe** (`/hilfe`) und **API-Dokumentation** (`/api-docs`, Swagger UI)

Die bestehende HTML-App (`../filesystem.html`) bleibt unverändert im übergeordneten Verzeichnis.

## Voraussetzungen

- Node.js 20+
- npm

## Einrichtung

```bash
cd repository-next
cp .env.example .env.local
# SESSION_SECRET und ggf. DATAHUB_* anpassen
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

| Seite | Pfad |
|-------|------|
| Repository-UI | `/` |
| Hilfe | `/hilfe` |
| API-Dokumentation (Swagger) | `/api-docs` |
| OpenAPI-Spezifikation | `/openapi-datahub.yaml` |

## Architektur

```
Browser → /api/* (Next.js) → https://datahub.iab.de
              ↑
        iron-session (HttpOnly Cookie, DataHub Bearer Token)
```

| Route | Funktion |
|-------|----------|
| `POST /api/auth/login` | Passwort prüfen, DataHub-Token holen |
| `POST /api/auth/logout` | Session löschen |
| `GET /api/auth/session` | Login-Status |
| `GET /api/files` | Liste mit Filtern (Proxy) |
| `POST /api/files` | Upload multipart (Proxy) |
| `GET /api/files/[id]/download` | Download (Proxy) |
| `PATCH /api/files/[id]` | Metadaten (Proxy, falls DataHub unterstützt) |
| `DELETE /api/files/[id]` | Löschen (Proxy) |

## Docker

```bash
docker build -t iab-repository-next .
docker run -p 3000:3000 --env-file .env.local iab-repository-next
```

## Legacy-App

Die ursprüngliche statische App liegt weiterhin unter `../filesystem.html` (unabhängig von dieser Next-App).

## Python-Import-Skripte

Massenimport (Elasticsearch → DataHub) bleibt in den Skripten im Parent-Ordner:

- `import_kurzber_elastic.py`
- `upload_kurzber_2024.py`

## Git / GitHub einchecken

Voraussetzung: [Git für Windows](https://git-scm.com/download/win) (mit Git Credential Manager).

### Einmalig: Repository konfigurieren

```powershell
cd repository-next
powershell -ExecutionPolicy Bypass -File .\scripts\git-setup.ps1
```

Das Skript setzt **nur für dieses Projekt** (nicht global):

| Einstellung | Wert |
|-------------|------|
| `user.name` | FranksZeug |
| `user.email` | frank@frankpohlmann.de |
| `credential.helper` | manager (Token wird nach dem ersten Push gespeichert) |
| `origin` | `https://github.com/FranksZeug/repository-next.git` |

### Einmalig auf GitHub

1. Neues **leeres** Repository anlegen: [github.com/new](https://github.com/new)  
   - Owner: **FranksZeug**  
   - Name: **repository-next**  
   - Kein README, keine .gitignore, keine Lizenz (alles liegt lokal vor)
2. **Personal Access Token (PAT)** erstellen:  
   GitHub → Settings → Developer settings → [Personal access tokens](https://github.com/settings/tokens)  
   - Classic Token mit Berechtigung **repo**, oder Fine-grained mit Zugriff auf dieses Repository  
   - GitHub akzeptiert beim `git push` **kein Kontopasswort** mehr – im Passwort-Feld den **PAT** eintragen

### Commit und Push (Kommandozeile)

```powershell
cd c:\xampp2023\htdocs\iabUpload\repository-next
git add -A
git status
git commit -m "IAB Repository Service (Next.js) mit BFF, Hilfe und API-Docs"
git branch -M main
git push -u origin main
```

Beim ersten Push:

- **Benutzername:** `FranksZeug`
- **Passwort:** Ihr PAT (wird unter Windows im Credential Manager gespeichert)

Danach reicht `git push` ohne erneute Eingabe.

### Hinweise

- `.env.local` und andere `.env*`-Dateien werden **nicht** versioniert (nur `.env.example`).
- Remote-URL ändern: `git remote set-url origin https://github.com/FranksZeug/ANDERER-NAME.git`
