import { describe, expect, it, vi } from "vitest";
import {
  CLOUD_TRANSLATION_CODES,
  TRANSLATION_LANGUAGES,
  buildTranslateRequest,
  describeTranslateError,
  translateEndpoint,
  translateWithCloudTranslation,
} from "./cloud-translation";

function okResponse(translatedText: string): Response {
  return new Response(JSON.stringify({ translations: [{ translatedText }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("language codes", () => {
  it("covers every app language exactly once", () => {
    expect(Object.keys(CLOUD_TRANSLATION_CODES).sort()).toEqual(
      [...TRANSLATION_LANGUAGES].sort(),
    );
  });

  it("sends Simplified Chinese for the app's zh", () => {
    // The app's zh strings are Simplified throughout; Traditional would read
    // as a different language to the tourist the picker promised Chinese to.
    expect(buildTranslateRequest("x", "th", "zh").targetLanguageCode).toBe("zh-CN");
  });

  it("builds a plain-text request with the mapped codes", () => {
    expect(buildTranslateRequest("ราคา", "th", "ko")).toEqual({
      contents: ["ราคา"],
      sourceLanguageCode: "th",
      targetLanguageCode: "ko",
      mimeType: "text/plain",
    });
  });

  it("targets the project's global location", () => {
    expect(translateEndpoint("thaishield-ai-790eb")).toBe(
      "https://translation.googleapis.com/v3/projects/thaishield-ai-790eb/locations/global:translateText",
    );
  });
});

describe("translateWithCloudTranslation", () => {
  const deps = (fetchImpl: typeof fetch) => ({
    projectId: "p",
    getAccessToken: async () => "tok",
    fetchImpl,
  });

  it("calls once per target, skips the source, and returns only non-empty results", async () => {
    const calls: { url: string; body: unknown; auth: string | null }[] = [];
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      calls.push({
        url: String(url),
        body,
        auth: new Headers(init?.headers).get("Authorization"),
      });
      // Korean comes back blank — must be absent, not "".
      if (body.targetLanguageCode === "ko") return okResponse("   ");
      return okResponse(`[${body.targetLanguageCode}] ${body.contents[0]}`);
    }) as unknown as typeof fetch;

    const result = await translateWithCloudTranslation(
      "  ผัดไทย ",
      "th",
      ["th", "en", "zh", "ko"],
      deps(fetchImpl),
    );

    expect(calls).toHaveLength(3);
    expect(calls.every((c) => c.auth === "Bearer tok")).toBe(true);
    expect(calls.map((c) => (c.body as { targetLanguageCode: string }).targetLanguageCode)).toEqual([
      "en",
      "zh-CN",
      "ko",
    ]);
    // Source text is trimmed before it is sent.
    expect((calls[0]!.body as { contents: string[] }).contents).toEqual(["ผัดไทย"]);
    expect(result).toEqual({ en: "[en] ผัดไทย", zh: "[zh-CN] ผัดไทย" });
    expect("ko" in result).toBe(false);
  });

  it("refuses an empty source rather than translating nothing", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    await expect(
      translateWithCloudTranslation("   ", "th", ["en"], deps(fetchImpl)),
    ).rejects.toThrow(/source field is empty/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("surfaces the API error as an actionable sentence", async () => {
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({
          error: {
            code: 403,
            status: "PERMISSION_DENIED",
            message:
              "Cloud Translation API has not been used in project 479467305669 before or it is disabled.",
            details: [{ reason: "SERVICE_DISABLED" }],
          },
        }),
        { status: 403 },
      )) as unknown as typeof fetch;

    await expect(
      translateWithCloudTranslation("ราคา", "th", ["en"], deps(fetchImpl)),
    ).rejects.toThrow(/not enabled for this Firebase project/);
  });
});

describe("describeTranslateError", () => {
  it("names the missing IAM role on a plain 403", () => {
    expect(describeTranslateError(403, '{"error":{"message":"denied"}}')).toMatch(
      /roles\/cloudtranslate\.user/,
    );
  });

  it("keeps the API's own message for anything else", () => {
    expect(
      describeTranslateError(400, '{"error":{"message":"Target language is invalid."}}'),
    ).toBe("Cloud Translation failed (HTTP 400): Target language is invalid.");
  });

  it("does not choke on a non-JSON body", () => {
    expect(describeTranslateError(502, "<html>Bad Gateway</html>")).toMatch(/HTTP 502/);
  });
});
