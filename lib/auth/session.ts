import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import { assertAdminClaims, type AdminTokenClaims } from "./admin-claims";
import { ADMIN_ALLOWED_DOMAIN } from "./config";

const SESSION_COOKIE_NAME = "__session";
// 5 days — the maximum Firebase allows for a session cookie's expiresIn.
const SESSION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 5;

export interface AdminSession {
  uid: string;
  email: string;
}

/**
 * Verifies the freshly-signed-in client ID token, re-checks the admin
 * domain claim server-side (never trust the client), then exchanges it
 * for a long-lived, httpOnly session cookie. Call only from a Server
 * Action / Route Handler (cookies().set() requires that context).
 */
export async function createAdminSessionCookie(idToken: string): Promise<void> {
  const decoded = await getAdminAuth().verifyIdToken(idToken);
  assertAdminClaims(decoded as AdminTokenClaims, ADMIN_ALLOWED_DOMAIN);

  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRES_IN_MS,
  });

  cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
    maxAge: SESSION_EXPIRES_IN_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Re-verifies the session cookie (and the admin domain claim) on every
 * call — per WEB_ADMIN.md §4, protected routes/Server Actions must not
 * rely on a one-time login check. Returns null for any invalid/expired/
 * revoked/non-admin session rather than throwing, so callers can just
 * redirect to /login.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true);
    assertAdminClaims(decoded as AdminTokenClaims, ADMIN_ALLOWED_DOMAIN);
    return { uid: decoded.uid, email: decoded.email ?? "" };
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  cookies().set(SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
}
