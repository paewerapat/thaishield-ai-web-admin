import { describe, expect, it } from "vitest";
import { parseServiceAccountKey } from "./admin";

const FAKE_KEY =
  "-----BEGIN PRIVATE KEY-----\nfake-not-a-real-key\n-----END PRIVATE KEY-----\n";

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
