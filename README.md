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

## Auf anderen Server deployen (ohne Quellcode)

Die App wird als **Standalone-Paket** gebaut – Sie kopieren nur den fertigen Ordner, **nicht** das ganze Entwicklungsprojekt mit `node_modules`.

### Auf Ihrem PC bauen und packen

```powershell
cd repository-next
powershell -ExecutionPolicy Bypass -File .\scripts\package-deploy.ps1
```

Ergebnis:

| Ausgabe | Inhalt |
|---------|--------|
| `deploy/iab-repository/` | Fertiger Server-Ordner |
| `deploy/iab-repository.zip` | Zum Hochladen per SFTP/SCP |

### Auf dem Zielserver

**Voraussetzung:** [Node.js 20+](https://nodejs.org) (nur Runtime, kein npm-Build nötig)

```bash
# ZIP entpacken oder Ordner kopieren nach z.B. /opt/iab-repository
cd /opt/iab-repository
cp .env.example .env.local
nano .env.local   # SESSION_SECRET + DATAHUB_* setzen
chmod +x start.sh
./start.sh
```

Die App lauscht auf **Port 3000** (`PORT=8080 ./start.sh` zum Ändern).

### Reverse-Proxy (optional)

Vor Apache/Nginx die App intern lassen und nur nach außen proxen:

```apache
# Apache (mod_proxy)
ProxyPass / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/
```

```nginx
# Nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

### Was Sie **nicht** auf den Server kopieren müssen

- Gesamtes `repository-next` mit Dev-`node_modules`
- `.env.local` vom Entwicklungs-PC (Secrets neu auf dem Server setzen)
- Ordner `.git`, `.next` vom Dev-Rechner (steckt alles im Paket `deploy/iab-repository`)

### Alternative: Docker auf dem Server

```bash
git clone git@github.com:FranksZeug/repository-next.git
cd repository-next
cp .env.example .env.local   # anpassen
docker build -t iab-repository .
docker run -d -p 3000:3000 --env-file .env.local --name iab-repo iab-repository
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
