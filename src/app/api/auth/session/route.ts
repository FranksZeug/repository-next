import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return Response.json({ ok: true });
}

export async function GET() {
  const session = await getSession();
  return Response.json({
    isLoggedIn: Boolean(session.isLoggedIn && session.token),
  });
}
