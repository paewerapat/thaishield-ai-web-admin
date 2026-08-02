"use server";

import { clearAdminSession, createAdminSessionCookie } from "@/lib/auth/session";

export type SignInResult = { ok: true } | { ok: false; error: string };

export async function signInWithGoogleIdToken(
  idToken: string,
): Promise<SignInResult> {
  try {
    await createAdminSessionCookie(idToken);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Sign-in failed.",
    };
  }
}

export async function signOutAdmin(): Promise<void> {
  clearAdminSession();
}
