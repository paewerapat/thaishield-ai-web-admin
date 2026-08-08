"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { BrandMark } from "@/components/admin/brand-mark";
import {
  createGoogleProvider,
  getFirebaseClientAuth,
} from "@/lib/firebase/client";
import { signInWithGoogleIdToken } from "@/lib/auth/actions";
import { ADMIN_ALLOWED_DOMAIN } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Google's "G" mark. Inline rather than from lucide-react — lucide dropped
 * third-party brand icons, and Google's sign-in branding guidelines require
 * their own four-colour glyph rather than a generic substitute.
 */
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.55Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.55-2.03-6.46-4.76H1.69v2.98A11.5 11.5 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.54 14.66a6.9 6.9 0 0 1 0-4.41V7.27H1.69a11.5 11.5 0 0 0 0 10.37l3.85-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.72 1.2 15.11 0 12 0A11.5 11.5 0 0 0 1.69 7.27l3.85 2.98C6.45 7.52 9 4.75 12 4.75Z"
      />
    </svg>
  );
}

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand p-6">
      {/* Bangkok skyline along the bottom edge, matching the Flutter app's
          bottom-nav treatment (CLAUDE.md §8). Decorative only. */}
      <Image
        src="/images/skyline.png"
        alt=""
        aria-hidden
        width={904}
        height={264}
        priority
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full select-none opacity-[0.08]"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size={72} className="mb-4 shadow-lg" />
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
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                <>
                  <GoogleGlyph />
                  Sign in with Google
                </>
              )}
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
