import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  token?: string;
  isLoggedIn: boolean;
}

function getSessionPassword(): string {
  return (
    process.env.SESSION_SECRET ??
    "dev-only-change-me-in-production-32chars!!"
  );
}

export const sessionOptions: SessionOptions = {
  password: getSessionPassword(),
  cookieName: "iab_repository_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireToken(): Promise<string> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.token) {
    throw new AuthError("Nicht angemeldet.");
  }
  return session.token;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
