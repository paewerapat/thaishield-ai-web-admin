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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <main className="flex min-h-screen items-center justify-center bg-brand p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-wide text-gold">
            ThaiShield AI
          </h1>
          <p className="mt-1 text-sm text-brand-foreground/60">Web Admin</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Sign in with your{" "}
              <span className="font-medium text-foreground">
                @{ADMIN_ALLOWED_DOMAIN}
              </span>{" "}
              Google account.
            </p>

            <Button
              type="button"
              onClick={handleSignIn}
              disabled={loading}
              className="mt-5 w-full"
            >
              {loading ? "Signing in…" : "Sign in with Google"}
            </Button>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-brand-foreground/40">
          Internal tool. Access is restricted to ThaiShield staff.
        </p>
      </div>
    </main>
  );
}
