"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { requireEnv } from "@/lib/env";

/** Same value the server-side session check (lib/auth) must enforce — see WEB_ADMIN.md §4. */
export const ADMIN_ALLOWED_DOMAIN =
  process.env.NEXT_PUBLIC_ADMIN_ALLOWED_DOMAIN || "thaishieldapp.com";

function getFirebaseClientConfig() {
  return {
    apiKey: requireEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: requireEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: requireEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: requireEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: requireEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
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
