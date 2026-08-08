"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { ADMIN_ALLOWED_DOMAIN } from "@/lib/auth/config";

/**
 * Next.js inlines NEXT_PUBLIC_* into the browser bundle by *textually*
 * substituting each literal `process.env.NEXT_PUBLIC_FOO` occurrence at build
 * time. A dynamic lookup — `process.env[key]`, which `lib/env.ts`'s
 * `requireEnv()` does — presents no such literal to substitute, so in the
 * browser every value reads back `undefined` however complete `.env.local` is.
 * `requireEnv()` is therefore SERVER-ONLY; this file spells each variable out
 * so webpack can see and replace it.
 *
 * Do NOT collapse these into a loop, a lookup table, or `requireEnv()`. Any of
 * those still type-checks, builds, and lints clean, then fails at runtime in
 * the browser with "Missing required environment variable".
 */
const CLIENT_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

function requireClientEnv(name: keyof typeof CLIENT_ENV): string {
  const value = CLIENT_ENV[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. NEXT_PUBLIC_* values are ` +
        "baked into the bundle at build time, so after adding one to .env.local " +
        "you must restart `npm run dev` (or re-run `npm run build`) for it to " +
        "take effect.",
    );
  }
  return value;
}

function getFirebaseClientConfig() {
  return {
    apiKey: requireClientEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: requireClientEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: requireClientEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: requireClientEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: requireClientEnv(
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    ),
    appId: requireClientEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
  };
}

let app: FirebaseApp | undefined;

export function getFirebaseClientApp(): FirebaseApp {
  if (app) return app;

  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0]!;
    return app;
  }

  app = initializeApp(getFirebaseClientConfig());
  return app;
}

export function getFirebaseClientAuth() {
  return getAuth(getFirebaseClientApp());
}

/**
 * hd (hosted domain) is a UX filter on the Google account chooser only —
 * NOT a security control. The real enforcement is the server-side `hd`
 * claim check in lib/auth on the verified ID token. See WEB_ADMIN.md §4.
 */
export function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ hd: ADMIN_ALLOWED_DOMAIN });
  return provider;
}
