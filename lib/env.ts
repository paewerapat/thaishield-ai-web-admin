/**
 * SERVER-ONLY. Both helpers here read `process.env[key]` dynamically, which
 * works on the server but is invisible to Next.js's build-time inlining of
 * `NEXT_PUBLIC_*` — that pass only rewrites literal `process.env.NEXT_PUBLIC_FOO`
 * text. Called from a `"use client"` module these always see `undefined`, no
 * matter what `.env.local` contains. Client components must reference
 * `process.env.NEXT_PUBLIC_FOO` directly; see `lib/firebase/client.ts` for the
 * pattern.
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function optionalEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}
