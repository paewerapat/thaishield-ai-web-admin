import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type AppOptions,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth as getAdminAuthSdk } from "firebase-admin/auth";
import { getFirestore as getAdminFirestoreSdk } from "firebase-admin/firestore";
import { getStorage as getAdminStorageSdk } from "firebase-admin/storage";
import { optionalEnv } from "@/lib/env";

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

/**
 * Builds the Admin SDK credential. Two supported paths, in priority order:
 *
 * 1. `FIREBASE_SERVICE_ACCOUNT_KEY` — the downloaded service account JSON.
 * 2. Application Default Credentials, when that env var is absent.
 *
 * Path 2 is the preferred setup, not merely a fallback. Many GCP organizations
 * enforce `constraints/iam.disableServiceAccountKeyCreation` — on by default
 * for organizations created since mid-2024 — which makes path 1 impossible:
 * the Console refuses with "Key creation is not allowed on this service
 * account". ADC needs no key file at all:
 *
 *   - Deployed: the SSR backend runs on Cloud Functions/Cloud Run (WEB_ADMIN.md
 *     §10) *as* a service account, so ADC resolves with zero configuration and
 *     there is no long-lived secret to leak or rotate.
 *   - Local dev: `gcloud auth application-default login`.
 */
export function resolveCredential(serviceAccountKey: string | undefined) {
  if (serviceAccountKey) {
    return cert(parseServiceAccountKey(serviceAccountKey));
  }

  try {
    return applicationDefault();
  } catch (cause) {
    throw new Error(
      "No Firebase credentials found. Either run `gcloud auth " +
        "application-default login` (preferred — no key file needed), or set " +
        "FIREBASE_SERVICE_ACCOUNT_KEY in .env.local. When deployed to Cloud " +
        "Functions/Cloud Run, neither step is needed — the runtime service " +
        "account supplies credentials automatically.",
      { cause },
    );
  }
}

let app: App | undefined;

function getFirebaseAdminApp(): App {
  if (app) return app;

  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0]!;
    return app;
  }

  const options: AppOptions = {
    credential: resolveCredential(optionalEnv("FIREBASE_SERVICE_ACCOUNT_KEY")),
  };

  // Both matter specifically on the ADC path. A service account key carries its
  // own `project_id`, but ADC from `gcloud auth application-default login` does
  // not, so Firestore would fail with "Unable to detect a Project Id". And
  // `getAdminStorage().bucket()` in lib/actions/partner-locations.ts takes no
  // bucket name, so it resolves the default from `storageBucket` here.
  const projectId = optionalEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (projectId) options.projectId = projectId;

  const storageBucket = optionalEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (storageBucket) options.storageBucket = storageBucket;

  app = initializeApp(options);
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
