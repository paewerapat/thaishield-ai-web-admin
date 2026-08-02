import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth as getAdminAuthSdk } from "firebase-admin/auth";
import { getFirestore as getAdminFirestoreSdk } from "firebase-admin/firestore";
import { getStorage as getAdminStorageSdk } from "firebase-admin/storage";
import { requireEnv } from "@/lib/env";

/**
 * Parses and validates the FIREBASE_SERVICE_ACCOUNT_KEY env var (the raw
 * service account JSON downloaded from Firebase Console, as a single-line
 * string). Kept separate from Firebase SDK calls so it's unit-testable
 * without real credentials.
 */
export function parseServiceAccountKey(json: string): ServiceAccount {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Expected the full " +
        "service account key JSON as a single-line string — see .env.example.",
    );
  }

  const projectId = parsed.project_id;
  const clientEmail = parsed.client_email;
  const privateKey = parsed.private_key;

  if (
    typeof projectId !== "string" ||
    typeof clientEmail !== "string" ||
    typeof privateKey !== "string" ||
    !projectId ||
    !clientEmail ||
    !privateKey
  ) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is missing required fields " +
        "(project_id, client_email, private_key).",
    );
  }

  return { projectId, clientEmail, privateKey };
}

let app: App | undefined;

function getFirebaseAdminApp(): App {
  if (app) return app;

  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0]!;
    return app;
  }

  const serviceAccount = parseServiceAccountKey(
    requireEnv("FIREBASE_SERVICE_ACCOUNT_KEY"),
  );
  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

export function getAdminAuth() {
  return getAdminAuthSdk(getFirebaseAdminApp());
}

export function getAdminFirestore() {
  return getAdminFirestoreSdk(getFirebaseAdminApp());
}

export function getAdminStorage() {
  return getAdminStorageSdk(getFirebaseAdminApp());
}
