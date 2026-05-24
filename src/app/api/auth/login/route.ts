import { createDatahubToken } from "@/lib/datahub";
import { getSession } from "@/lib/session";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = body.password?.trim();
    if (!password) {
      return Response.json({ message: "Passwort fehlt." }, { status: 422 });
    }

    const token = await createDatahubToken(password);
    const session = await getSession();
    session.token = token;
    session.isLoggedIn = true;
    await session.save();

    return Response.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.";
    return Response.json({ message }, { status: 401 });
  }
}
