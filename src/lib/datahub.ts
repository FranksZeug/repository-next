import { AuthError } from "@/lib/session";

export function getDatahubBaseUrl(): string {
  return (process.env.DATAHUB_BASE_URL || "https://datahub.iab.de").replace(
    /\/+$/,
    ""
  );
}

export function getDatahubEmail(): string {
  return process.env.DATAHUB_EMAIL || "demo@iab.de";
}

export async function createDatahubToken(password: string): Promise<string> {
  const res = await fetch(`${getDatahubBaseUrl()}/api/tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: getDatahubEmail(),
      password,
      token_name: process.env.DATAHUB_TOKEN_NAME || "repository-next",
    }),
  });

  const text = await res.text();
  let json: { token?: string; message?: string };
  try {
    json = JSON.parse(text) as { token?: string; message?: string };
  } catch {
    json = { message: text || "Ungültige Antwort vom DataHub." };
  }

  if (!res.ok || !json.token) {
    const msg = json.message || `Token-Erstellung fehlgeschlagen (${res.status}).`;
    throw new Error(msg);
  }

  return json.token;
}

export async function datahubFetch(
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith("http")
    ? path
    : `${getDatahubBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  return fetch(url, { ...init, headers });
}

export async function parseDatahubError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { message?: string };
    return json.message || `DataHub-Fehler (${res.status}).`;
  } catch {
    return text || `DataHub-Fehler (${res.status}).`;
  }
}

export function jsonError(message: string, status: number) {
  return Response.json({ message }, { status });
}

export function handleRouteError(err: unknown) {
  if (err instanceof AuthError) {
    return jsonError(err.message, 401);
  }
  if (err instanceof Error) {
    return jsonError(err.message, 500);
  }
  return jsonError("Unbekannter Fehler.", 500);
}
