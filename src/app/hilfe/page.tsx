import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hilfe – IAB Repository Service",
  description: "Kurzübersicht zu fachlichen und technischen Prozessen",
};

export default function HilfePage() {
  return (
    <main className="help-page">
      <h1>Hilfe – IAB-Backend-Repository-Service</h1>
      <p className="muted">Kurzübersicht zu fachlichen und technischen Prozessen.</p>
      <Link className="back-link" href="/">
        Zurück zur Anwendung
      </Link>

      <section className="help-card">
        <h2>Rolle des IAB-Backend-Repository-Service</h2>
        <p>
          Das IAB-Backend-Repository-Service dient als zentrale Plattform, um Forschungsergebnisse des Instituts
          sichtbar, auffindbar und mehrfach nutzbar bereitzustellen. Dort werden Publikationen, Forschungsdaten,
          Podcasts und Videos für Öffentlichkeit, Presse und Politik gebündelt veröffentlicht.
        </p>
        <p>
          Ein besonderer Mehrwert liegt in der erneuten Nutzung von Daten und Ergebnissen: Auf Basis der Forschung
          erstellte Auswertungen werden zusätzlich als Dateien abgelegt und können für neue Berichte, Präsentationen
          und Transferformate weiterverwendet werden.
        </p>
        <p>So entsteht ein effizientes digitales Schaufenster des Instituts:</p>
        <ul>
          <li>mehr Reichweite und Sichtbarkeit</li>
          <li>schnellere Verwertung von Forschungsergebnissen</li>
          <li>bessere Unterstützung von Presse und Politik</li>
          <li>höhere Effizienz durch Wiederverwendung von Daten</li>
          <li>Stärkung des Transfers in die Öffentlichkeit</li>
        </ul>
        <p>
          <strong>Kurz:</strong> Das IAB-Backend-Repository macht Forschung nicht nur verfügbar, sondern auch aktiv
          nutzbar.
        </p>
      </section>

      <section className="help-card">
        <h2>1) Fachlicher Prozess</h2>
        <ul>
          <li>
            <strong>Recherche zuerst:</strong> Über Filter nach <code>Pfad</code>, <code>Jahr</code> und optional{" "}
            <code>aktiv_id</code> prüfen, ob Dokumente bereits vorhanden sind.
          </li>
          <li>
            <strong>Upload danach:</strong> Neue Dateien nur in erlaubte Pfade hochladen. Der Zielpfad wird deutlich
            angezeigt (z.&nbsp;B. <code>kurzberichte/2026</code>).
          </li>
          <li>
            <strong>Qualitätscheck:</strong> Vor dem Upload den rot markierten Zielpfad prüfen, wenn Dateien
            ausgewählt wurden.
          </li>
          <li>
            <strong>Dateiverwaltung:</strong> In der Ergebnisliste (u.&nbsp;a. <code>aktiv_id</code>,{" "}
            <code>titel</code>, <code>reprotyp</code>, <code>freigabe</code>) kann über den Dateinamen heruntergeladen
            und über <code>X</code> gelöscht werden. Metadaten bearbeiten über ✎ (sofern der DataHub PATCH unterstützt).
          </li>
        </ul>
      </section>

      <section className="help-card">
        <h2>2) Authentifizierung und Sicherheit</h2>
        <ul>
          <li>Anmeldung erfolgt über einen Passwort-Dialog beim ersten Aufruf.</li>
          <li>Das Passwort wird serverseitig geprüft; der DataHub-Bearer-Token liegt in einer HttpOnly-Session.</li>
          <li>Token und Passwort werden nicht im Browser-LocalStorage oder sessionStorage abgelegt.</li>
          <li>Bei Fehler bleibt die Anwendung gesperrt und zeigt eine Meldung an.</li>
          <li>Abmelden über das Symbol in der Kopfzeile (Session wird serverseitig gelöscht).</li>
        </ul>
      </section>

      <section className="help-card">
        <h2>3) Technischer Ablauf im Hintergrund</h2>
        <ul>
          <li>
            <strong>Token:</strong> <code>POST /api/tokens</code> mit E-Mail, Passwort und Token-Name (serverseitig
            durch die Next.js-App).
          </li>
          <li>
            <strong>Token widerrufen:</strong> <code>DELETE /api/tokens/current</code> mit{" "}
            <code>Authorization: Bearer &lt;TOKEN&gt;</code>.
          </li>
          <li>
            <strong>Liste:</strong> <code>GET /api/files</code> mit kombinierbaren Query-Parametern: <code>path</code>{" "}
            (Präfix), <code>aktiv_id</code>, <code>since</code> (ISO 8601 mit Zeitzone), <code>freigabe</code> (
            <code>1</code>/<code>0</code>), <code>reprotyp</code>. Paginiert (<strong>100 Einträge pro Seite</strong>
            ), sortiert nach Hochladezeit (neueste zuerst).
          </li>
          <li>
            <strong>Upload:</strong> <code>POST /api/files</code> als <code>multipart/form-data</code> mit{" "}
            <code>files[]</code> und optionalen Metadaten.
          </li>
          <li>
            <strong>Download:</strong> <code>GET /api/files/&#123;id&#125;/download</code>
          </li>
          <li>
            <strong>Löschen:</strong> <code>DELETE /api/files/&#123;id&#125;</code> mit Sicherheitsabfrage im Modal.
          </li>
          <li>
            <strong>Metadaten:</strong> <code>PATCH /api/files/&#123;id&#125;</code> (falls vom DataHub unterstützt).
          </li>
        </ul>
        <p className="muted">
          Interaktive API-Dokumentation: <Link href="/api-docs">/api-docs</Link> (Swagger UI). OpenAPI-Spezifikation:{" "}
          <a href="/openapi-datahub.yaml">openapi-datahub.yaml</a>.
        </p>
      </section>

      <section className="help-card">
        <h2>4) Bedienhinweise</h2>
        <ul>
          <li>
            <strong>Pfad = Alle:</strong> Upload ist deaktiviert, bis ein konkreter Pfad ausgewählt wird.
          </li>
          <li>
            <strong>Jahresfilter:</strong> Standard ist das aktuelle Jahr; der Upload nutzt denselben Pfad/Jahr-Kontext
            wie die Suche.
          </li>
          <li>
            <strong>Filter:</strong> Zusätzlich <code>aktiv_id</code>, <code>reprotyp</code>, <code>freigabe</code> und{" "}
            <code>since</code> (lokale Zeit wird mit Zeitzone an die API übergeben).
          </li>
          <li>
            <strong>Upload-Metadaten:</strong> Unter „Metadaten (optional)“ können weitere API-Felder gesetzt werden.
          </li>
          <li>
            <strong>Reset-Icon:</strong> Setzt die Filter auf Standardwerte zurück.
          </li>
          <li>
            <strong>Theme:</strong> Hell/Dunkel in der Kopfzeile – Einstellung wird im Browser gespeichert.
          </li>
        </ul>
      </section>

      <section className="help-card">
        <h2>5) Dateitypen, Limits und Validierung</h2>
        <ul>
          <li>
            <strong>Erlaubte Dateitypen:</strong> <code>pdf</code>, <code>txt</code>, <code>csv</code>,{" "}
            <code>jpg/jpeg</code>, <code>png</code>, <code>gif</code>, <code>webp</code>, <code>doc</code>,{" "}
            <code>docx</code>, <code>xlsx</code>, <code>pptx</code>, <code>zip</code>, <code>mp4</code>, <code>rdf</code>
            , <code>wav</code>, <code>mp3</code>, <code>ogg</code>, <code>json</code>.
          </li>
          <li>
            <strong>Maximale Dateianzahl pro Upload:</strong> <code>25</code> Dateien.
          </li>
          <li>
            <strong>Maximale Dateigröße:</strong> <code>200 MB</code> pro Datei.
          </li>
          <li>
            <strong>Rate Limit Upload:</strong> <code>60 Requests / Minute</code>.
          </li>
          <li>
            <strong>Rate Limit Token-Erzeugung:</strong> <code>10 Requests / Minute</code>.
          </li>
          <li>
            <strong>Pfadregeln:</strong> Erlaubt sind <code>a-z A-Z 0-9 . _ -</code> und <code>/</code>; kein
            führender/abschließender Slash und keine <code>..</code>-Segmente.
          </li>
          <li>
            <strong>Wichtig:</strong> Der MIME-Typ wird serverseitig geprüft (Magic-Bytes), nicht nur über Dateiendung.
          </li>
        </ul>
      </section>

      <section className="help-card">
        <h2>6) Fehlerbilder</h2>
        <ul>
          <li>
            <code>401</code>: Token fehlt/ungültig – erneut anmelden.
          </li>
          <li>
            <code>403</code>: Download gesperrt (<code>freigabe=false</code> oder <code>sperrfrist</code> liegt in der
            Zukunft).
          </li>
          <li>
            <code>405</code>: Metadaten-Update noch nicht vom DataHub unterstützt.
          </li>
          <li>
            <code>422</code>: Validierungsfehler (Dateityp, Pfad, Größe).
          </li>
          <li>
            <code>404</code>: Datei oder Endpoint nicht gefunden.
          </li>
          <li>
            <code>429</code>: Rate-Limit erreicht, kurz warten und erneut versuchen.
          </li>
        </ul>
      </section>

      <section className="help-card">
        <h2>7) Migration von Bestandsdateien</h2>
        <p>
          Für Massenimport (z.&nbsp;B. Kurzberichte aus Elasticsearch) stehen Python-Skripte im übergeordneten
          Projektordner bereit (<code>upload_kurzber_2024.py</code>, <code>import_kurzber_elastic.py</code>). Diese
          rufen die DataHub-API direkt auf und sind unabhängig von dieser Web-Anwendung.
        </p>
      </section>
    </main>
  );
}
