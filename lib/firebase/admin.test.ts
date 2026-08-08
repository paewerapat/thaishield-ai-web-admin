import { beforeEach, describe, expect, it, vi } from "vitest";
import { applicationDefault, cert } from "firebase-admin/app";
import { parseServiceAccountKey, resolveCredential } from "./admin";

// cert() validates the PEM via node:crypto and applicationDefault() reaches out
// for real ambient credentials — both are stubbed so these stay pure unit tests
// that pass identically on a machine with or without ADC configured.
vi.mock("firebase-admin/app", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase-admin/app")>();
  return {
    ...actual,
    cert: vi.fn(() => ({ kind: "cert" })),
    applicationDefault: vi.fn(() => ({ kind: "adc" })),
  };
});

const FAKE_KEY =
  "-----BEGIN PRIVATE KEY-----\nfake-not-a-real-key\n-----END PRIVATE KEY-----\n";

const FAKE_SERVICE_ACCOUNT_JSON = JSON.stringify({
  project_id: "demo-project",
  client_email: "admin@demo-project.iam.gserviceaccount.com",
  private_key: FAKE_KEY,
});

describe("parseServiceAccountKey", () => {
  it("parses a well-formed service account JSON", () => {
    const result = parseServiceAccountKey(
      JSON.stringify({
        project_id: "demo-project",
        client_email: "admin@demo-project.iam.gserviceaccount.com",
        private_key: FAKE_KEY,
      }),
    );

    expect(result).toEqual({
      projectId: "demo-project",
      clientEmail: "admin@demo-project.iam.gserviceaccount.com",
      privateKey: FAKE_KEY,
    });
  });

  it("throws a clear error on invalid JSON", () => {
    expect(() => parseServiceAccountKey("not json")).toThrow(/not valid JSON/);
  });

  it("throws when required fields are missing", () => {
    expect(() =>
      parseServiceAccountKey(JSON.stringify({ project_id: "demo-project" })),
    ).toThrow(/missing required fields/);
  });

  it("throws when a required field is present but empty", () => {
    expect(() =>
      parseServiceAccountKey(
        JSON.stringify({
          project_id: "demo-project",
          client_email: "",
          private_key: FAKE_KEY,
        }),
      ),
    ).toThrow(/missing required fields/);
  });
});

describe("resolveCredential", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the service account key when one is provided", () => {
    resolveCredential(FAKE_SERVICE_ACCOUNT_JSON);

    expect(cert).toHaveBeenCalledWith({
      projectId: "demo-project",
      clientEmail: "admin@demo-project.iam.gserviceaccount.com",
      privateKey: FAKE_KEY,
    });
    expect(applicationDefault).not.toHaveBeenCalled();
  });

  // The org-policy path: `constraints/iam.disableServiceAccountKeyCreation`
  // blocks generating a key at all, so an absent env var must fall through to
  // ADC rather than hard-failing on a missing variable.
  it("falls back to Application Default Credentials when no key is set", () => {
    resolveCredential(undefined);

    expect(applicationDefault).toHaveBeenCalled();
    expect(cert).not.toHaveBeenCalled();
  });

  it("treats an empty-string key as absent", () => {
    resolveCredential("");

    expect(applicationDefault).toHaveBeenCalled();
    expect(cert).not.toHaveBeenCalled();
  });

  it("still surfaces a malformed key instead of silently using ADC", () => {
    expect(() => resolveCredential("not json")).toThrow(/not valid JSON/);
    expect(applicationDefault).not.toHaveBeenCalled();
  });

  it("explains both setup options when ADC is unavailable", () => {
    vi.mocked(applicationDefault).mockImplementationOnce(() => {
      throw new Error("Could not load the default credentials");
    });

    expect(() => resolveCredential(undefined)).toThrow(
      /gcloud auth application-default login/,
    );
  });

  it("preserves the underlying ADC error as the cause", () => {
    const underlying = new Error("Could not load the default credentials");
    vi.mocked(applicationDefault).mockImplementationOnce(() => {
      throw underlying;
    });

    expect(() => resolveCredential(undefined)).toThrow(
      expect.objectContaining({ cause: underlying }),
    );
  });
});
