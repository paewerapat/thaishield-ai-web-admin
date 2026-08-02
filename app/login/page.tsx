"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import {
  createGoogleProvider,
  getFirebaseClientAuth,
} from "@/lib/firebase/client";
import { signInWithGoogleIdToken } from "@/lib/auth/actions";
import { ADMIN_ALLOWED_DOMAIN } from "@/lib/auth/config";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const auth = getFirebaseClientAuth();
      const result = await signInWithPopup(auth, createGoogleProvider());
      const idToken = await result.user.getIdToken();
      const outcome = await signInWithGoogleIdToken(idToken);

      if (!outcome.ok) {
        await auth.signOut();
        setError(outcome.error);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24 text-center">
      <h1 className="text-2xl font-semibold">ThaiShield AI — Web Admin</h1>
      <p className="text-sm text-neutral-500">
        Sign in with your @{ADMIN_ALLOWED_DOMAIN} Google account.
      </p>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in with Google"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </main>
  );
}
