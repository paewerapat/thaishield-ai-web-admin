"use server";

import { GoogleAuth } from "google-auth-library";
import { optionalEnv } from "@/lib/env";
import { parseServiceAccountKey } from "@/lib/firebase/admin";
import {
  CLOUD_TRANSLATION_SCOPE,
  TRANSLATION_LANGUAGES,
  translateWithCloudTranslation,
  type TranslationLanguage,
} from "@/lib/translation/cloud-translation";
import { actionError } from "./action-result";
import { requireAdminSession } from "./require-admin";

export type TranslateResult =
  | { ok: true; translations: Partial<Record<TranslationLanguage, string>> }
  | { ok: false; error: string };

let auth: GoogleAuth | undefined;

/**
 * The same credential path as `lib/firebase/admin.ts`, resolved by
 * google-auth-library directly because the Admin SDK does not hand out an
 * access token for other Google APIs. Deployed on App Hosting this is the Cloud
 * Run service account and needs nothing configured beyond the IAM role named in
 * WEB_ADMIN.md §3.12; locally it is `gcloud auth application-default login` or
 * the optional service-account key.
 */
function getAuth(): GoogleAuth {
  if (auth) return auth;
  const key = optionalEnv("FIREBASE_SERVICE_ACCOUNT_KEY");
  auth = new GoogleAuth({
    scopes: [CLOUD_TRANSLATION_SCOPE],
    ...(key
      ? {
          credentials: (() => {
            const parsed = parseServiceAccountKey(key);
            return {
              client_email: parsed.clientEmail,
              private_key: parsed.privateKey,
            };
          })(),
        }
      : {}),
  });
  return auth;
}

async function getAccessToken(): Promise<string> {
  const client = await getAuth().getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Google did not return an access token.");
  return token;
}

function isLanguage(value: unknown): value is TranslationLanguage {
  return (
    typeof value === "string" &&
    (TRANSLATION_LANGUAGES as readonly string[]).includes(value)
  );
}

/**
 * Translates one field's text into the requested app languages.
 *
 * What it does NOT do, on purpose: write anything. The result goes back to the
 * form, which puts each translation in its box and records the field as
 * `mt_pending` (machine translated, not yet reviewed). Only a human pressing
 * Save persists it, and the app keeps showing English for a pending field until
 * a human marks it reviewed — see WEB_ADMIN.md §3.12 for why that gate exists.
 */
export async function translateText(input: {
  text: string;
  source: TranslationLanguage;
  targets: TranslationLanguage[];
}): Promise<TranslateResult> {
  try {
    await requireAdminSession();

    if (!isLanguage(input.source)) {
      return { ok: false, error: `Unknown source language "${String(input.source)}".` };
    }
    const targets = Array.isArray(input.targets) ? input.targets.filter(isLanguage) : [];
    if (targets.length === 0) {
      return { ok: false, error: "No target languages to translate into." };
    }

    const projectId = optionalEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    if (!projectId) {
      return {
        ok: false,
        error: "NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set, so the translation endpoint cannot be built.",
      };
    }

    const translations = await translateWithCloudTranslation(
      String(input.text ?? ""),
      input.source,
      targets,
      { projectId, getAccessToken },
    );
    return { ok: true, translations };
  } catch (error) {
    return actionError(error);
  }
}
