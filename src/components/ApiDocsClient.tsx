"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useState } from "react";

const API_BASE = "https://datahub.iab.de";
const API_DOCS_THEME_KEY = "repository-api-docs-theme";

declare global {
  interface Window {
    ui?: {
      authActions: {
        authorize: (auth: Record<string, unknown>) => void;
      };
    };
    SwaggerUIBundle?: {
      (config: Record<string, unknown>): unknown;
      presets: { apis: unknown };
    };
    SwaggerUIStandalonePreset?: unknown;
  }
}

function normalizeBearerValue(value: string): string {
  const trimmed = value.trim();
  if (/^bearer\s+/i.test(trimmed)) {
    return trimmed.replace(/^bearer\s+/i, "");
  }
  return trimmed;
}

function looksLikeCredentials(value: string): boolean {
  return /@/.test(value) || /\s\/\s/.test(value);
}

export default function ApiDocsClient() {
  const [loginStatus, setLoginStatus] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [swaggerReady, setSwaggerReady] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [docsTheme, setDocsTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    let mode: "dark" | "light" = "light";
    try {
      const saved = localStorage.getItem(API_DOCS_THEME_KEY);
      if (saved === "light" || saved === "dark") {
        mode = saved;
      }
    } catch {
      // ignore
    }
    setDocsTheme(mode);
    document.documentElement.setAttribute("data-theme", mode);

    return () => {
      try {
        const appTheme = localStorage.getItem("repository-theme");
        if (appTheme === "light" || appTheme === "dark") {
          document.documentElement.setAttribute("data-theme", appTheme);
        }
      } catch {
        // ignore
      }
    };
  }, []);

  function setDocsThemeMode(mode: "dark" | "light") {
    setDocsTheme(mode);
    document.documentElement.setAttribute("data-theme", mode);
    try {
      localStorage.setItem(API_DOCS_THEME_KEY, mode);
    } catch {
      // ignore
    }
  }

  const applyBearerToken = useCallback((token: string) => {
    if (!token || !window.ui) return false;
    const clean = normalizeBearerValue(token);
    if (looksLikeCredentials(clean)) return false;
    window.ui.authActions.authorize({
      bearerAuth: {
        name: "bearerAuth",
        schema: { type: "http", scheme: "bearer", in: "header" },
        value: clean,
      },
    });
    return true;
  }, []);

  const initSwagger = useCallback(() => {
    if (!window.SwaggerUIBundle || !window.SwaggerUIStandalonePreset || window.ui) return;

    window.ui = window.SwaggerUIBundle({
      url: "/openapi-datahub.yaml",
      dom_id: "#swagger-ui",
      deepLinking: true,
      presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIStandalonePreset],
      layout: "StandaloneLayout",
      defaultModelsExpandDepth: 1,
      docExpansion: "list",
      tryItOutEnabled: true,
      persistAuthorization: true,
      requestInterceptor: (req: { headers?: Record<string, string> }) => {
        req.headers = req.headers || {};
        req.headers.Accept = "application/json";
        const auth = req.headers.Authorization || req.headers.authorization;
        if (auth) {
          const raw = auth.replace(/^Bearer\s+/i, "");
          if (looksLikeCredentials(raw)) {
            throw new Error(
              "Im Schloss (Authorize) stehen E-Mail/Passwort – das ist falsch. " +
                "Oben „Token holen & aktivieren“ nutzen oder nur den Token (z. B. 1|…) eintragen."
            );
          }
          req.headers.Authorization = "Bearer " + normalizeBearerValue(raw);
        }
        return req;
      },
      responseInterceptor: (res: { url?: string; status?: number; text?: string }) => {
        try {
          const url = (res.url || "").toLowerCase();
          if (url.includes("/api/tokens") && res.status && res.status >= 200 && res.status < 300 && res.text) {
            const body = JSON.parse(res.text);
            if (body?.token) {
              applyBearerToken(body.token);
              setLoginError(false);
              setLoginStatus("Token aus POST /api/tokens übernommen.");
            }
          }
        } catch {
          // optional
        }
        return res;
      },
    }) as NonNullable<Window["ui"]>;

    setSwaggerReady(true);
  }, [applyBearerToken]);

  async function handleTokenLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    setLoginLoading(true);
    setLoginError(false);
    setLoginStatus("Token wird angefordert…");

    try {
      const res = await fetch(`${API_BASE}/api/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password, token_name: "swagger-ui" }),
      });
      const text = await res.text();
      let json: { token?: string; message?: string };
      try {
        json = JSON.parse(text);
      } catch {
        json = { message: text || "Ungültige Server-Antwort" };
      }
      if (!res.ok || !json.token) {
        throw new Error(json.message || `Fehler ${res.status}`);
      }
      if (!window.ui) {
        setLoginError(true);
        setLoginStatus("Swagger lädt noch – bitte kurz warten und erneut klicken.");
        return;
      }
      if (!applyBearerToken(json.token)) {
        setLoginError(true);
        setLoginStatus("Token konnte nicht gesetzt werden.");
        return;
      }
      const preview = json.token.length > 18 ? `${json.token.slice(0, 14)}…` : json.token;
      setLoginStatus(`Angemeldet. Token aktiv: ${preview} – jetzt Endpunkte testen.`);
    } catch (err) {
      setLoginError(true);
      setLoginStatus(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen");
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={initSwagger}
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
        onLoad={initSwagger}
      />

      <div className="api-docs-top-bar">
        <div className="api-docs-top-row">
          <span>
            IAB DataHub File Upload API –
            <Link href="/">Zur Anwendung</Link> ·
            <Link href="/hilfe">Hilfe</Link> ·
            <a href="/openapi-datahub.yaml" download>
              openapi-datahub.yaml
            </a>
          </span>
          <div className="api-docs-theme-toggle">
            <button
              type="button"
              className={docsTheme === "light" ? "active" : ""}
              onClick={() => setDocsThemeMode("light")}
            >
              Hell
            </button>
            <button
              type="button"
              className={docsTheme === "dark" ? "active" : ""}
              onClick={() => setDocsThemeMode("dark")}
            >
              Dunkel
            </button>
          </div>
        </div>
        <div className="auth-login">
          <h2>Anmeldung für API-Tests</h2>
          <p>
            <span className="warn-lock">Das Schloss oben in Swagger ist nicht für E-Mail/Passwort.</span>{" "}
            Dort gehört nur der <strong>Token</strong> hin (z.&nbsp;B. <code>12|abc…</code>), den Sie hier holen
            oder aus der Antwort von <code>POST /api/tokens</code> kopieren.
          </p>
          <form className="auth-login-form" onSubmit={handleTokenLogin}>
            <div className="auth-login-field">
              <label htmlFor="loginEmail">E-Mail</label>
              <input id="loginEmail" name="email" type="email" autoComplete="username" defaultValue="demo@iab.de" required />
            </div>
            <div className="auth-login-field">
              <label htmlFor="loginPassword">Passwort</label>
              <input id="loginPassword" name="password" type="password" autoComplete="current-password" required />
            </div>
            <div className="auth-login-actions">
              <button type="submit" disabled={loginLoading || !swaggerReady}>
                {loginLoading ? "Bitte warten…" : "Token holen & aktivieren"}
              </button>
              <span className={loginError ? "login-status err" : "login-status ok"} role="status">
                {loginStatus}
              </span>
            </div>
          </form>
        </div>
        <p className="auth-hint">
          Nach erfolgreicher Anmeldung können Sie <code>GET /api/files</code> und andere Endpunkte unten testen.
          Alternativ: <code>POST /api/tokens</code> in der Liste ausführen – der Token wird dann ebenfalls automatisch
          gesetzt.
        </p>
      </div>
      <div id="swagger-ui" />
    </>
  );
}
