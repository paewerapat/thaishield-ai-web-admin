/**
 * Google Cloud Translation v3, called with the same Google credential the
 * Firebase Admin SDK already uses (WEB_ADMIN.md §3.12).
 *
 * Deliberately a plain module with injectable `fetch` and token getter: the
 * request shape, the language-code mapping and the error translation are what
 * a unit test can pin without a network, and they are also the parts that
 * break silently — a wrong language code returns *a* translation, just not the
 * one the staff member asked for.
 */

/** The six app languages, in the order the app's own picker lists them. */
export const TRANSLATION_LANGUAGES = ["th", "en", "zh", "ko", "ru", "ja"] as const;
export type TranslationLanguage = (typeof TRANSLATION_LANGUAGES)[number];

/**
 * App code → Cloud Translation code. Only Chinese differs: the app's `zh` is
 * Simplified Chinese (every ARB string and every seeded `name_zh` is
 * Simplified), and Cloud Translation's bare `zh` is documented as an alias
 * for `zh-CN`, but the explicit form is what the response echoes back, so we
 * send the explicit form and compare against it.
 */
export const CLOUD_TRANSLATION_CODES: Record<TranslationLanguage, string> = {
  th: "th",
  en: "en",
  zh: "zh-CN",
  ko: "ko",
  ru: "ru",
  ja: "ja",
};

export const CLOUD_TRANSLATION_SCOPE =
  "https://www.googleapis.com/auth/cloud-translation";

export function translateEndpoint(projectId: string): string {
  return `https://translation.googleapis.com/v3/projects/${encodeURIComponent(
    projectId,
  )}/locations/global:translateText`;
}

export interface TranslateRequestBody {
  contents: string[];
  sourceLanguageCode: string;
  targetLanguageCode: string;
  mimeType: "text/plain";
}

export function buildTranslateRequest(
  text: string,
  source: TranslationLanguage,
  target: TranslationLanguage,
): TranslateRequestBody {
  return {
    contents: [text],
    sourceLanguageCode: CLOUD_TRANSLATION_CODES[source],
    targetLanguageCode: CLOUD_TRANSLATION_CODES[target],
    // Plain text, never HTML: staff type prose, and the HTML mode would try to
    // preserve tags and escape `&` and `<` in the output.
    mimeType: "text/plain",
  };
}

/**
 * Turns the API's error into the sentence a staff member (or the developer
 * they forward it to) can act on. The one that will actually happen on a fresh
 * project is `SERVICE_DISABLED`: the API is not enabled by default and the
 * raw message is a paragraph of JSON with a URL buried in it.
 */
export function describeTranslateError(status: number, body: string): string {
  const enableUrl =
    "https://console.cloud.google.com/apis/library/translate.googleapis.com";
  if (status === 403 && /SERVICE_DISABLED|has not been used|is disabled/i.test(body)) {
    return (
      "Cloud Translation API is not enabled for this Firebase project. " +
      `Enable it once at ${enableUrl} (select the project), wait a minute, then try again.`
    );
  }
  if (status === 403) {
    return (
      "The server's Google credential is not allowed to call Cloud Translation. " +
      "Grant it the role 'Cloud Translation API User' (roles/cloudtranslate.user) in IAM."
    );
  }
  if (status === 401) {
    return "Could not authenticate to Cloud Translation. Check the server credentials (WEB_ADMIN.md §10.2).";
  }
  if (status === 429) {
    return "Cloud Translation quota exceeded for now. Try again in a minute.";
  }
  let detail = "";
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    detail = parsed.error?.message ?? "";
  } catch {
    detail = body.slice(0, 200);
  }
  return `Cloud Translation failed (HTTP ${status})${detail ? `: ${detail}` : "."}`;
}

interface TranslateResponseBody {
  translations?: { translatedText?: string }[];
}

export interface TranslateDeps {
  projectId: string;
  getAccessToken: () => Promise<string>;
  fetchImpl?: typeof fetch;
}

/**
 * Translates one text into several targets. One request per target because
 * v3 takes a single `targetLanguageCode` per call; six short strings is well
 * under any quota and keeps a failure in one language from blanking the rest.
 *
 * Returns only the languages that came back non-empty. The caller decides what
 * to do with a missing one; here it is simply absent, never `""`, so a blank
 * can never be mistaken for a translation.
 */
export async function translateWithCloudTranslation(
  text: string,
  source: TranslationLanguage,
  targets: readonly TranslationLanguage[],
  deps: TranslateDeps,
): Promise<Partial<Record<TranslationLanguage, string>>> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Nothing to translate — the source field is empty.");
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const token = await deps.getAccessToken();
  const url = translateEndpoint(deps.projectId);
  const out: Partial<Record<TranslationLanguage, string>> = {};

  for (const target of targets) {
    if (target === source) continue;
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(buildTranslateRequest(trimmed, source, target)),
    });

    if (!response.ok) {
      throw new Error(describeTranslateError(response.status, await response.text()));
    }

    const data = (await response.json()) as TranslateResponseBody;
    const translated = data.translations?.[0]?.translatedText?.trim();
    if (translated) out[target] = translated;
  }

  return out;
}
