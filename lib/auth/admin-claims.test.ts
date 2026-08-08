import { describe, expect, it } from "vitest";
import {
  AdminAuthError,
  assertAdminClaims,
  type AdminTokenClaims,
} from "./admin-claims";

const DOMAIN = "thaishieldapp.com";

/**
 * The claim set Firebase actually issues for a Google Workspace sign-in,
 * captured from a real `verifyIdToken` result (identifiers redacted). Note
 * what is NOT here: `hd`. Firebase does not forward Google's hosted-domain
 * claim, which is what STATUS.md item #1 was unsure about.
 */
const REAL_WORKSPACE_TOKEN: AdminTokenClaims = {
  email: "dev@thaishieldapp.com",
  email_verified: true,
  firebase: { sign_in_provider: "google.com" },
};

describe("assertAdminClaims", () => {
  it("accepts the claim set Firebase really issues for a Workspace sign-in", () => {
    // Regression guard: the original hd-only check rejected this exact token,
    // locking every legitimate admin out.
    expect(() => assertAdminClaims(REAL_WORKSPACE_TOKEN, DOMAIN)).not.toThrow();
  });

  it("accepts a token that does carry a matching hd", () => {
    expect(() =>
      assertAdminClaims({ ...REAL_WORKSPACE_TOKEN, hd: DOMAIN }, DOMAIN),
    ).not.toThrow();
  });

  it("rejects a present-but-mismatched hd even when the email domain matches", () => {
    expect(() =>
      assertAdminClaims({ ...REAL_WORKSPACE_TOKEN, hd: "someoneelse.com" }, DOMAIN),
    ).toThrow(/Access restricted to @thaishieldapp\.com/);
  });

  it("treats the domain half of the address case-insensitively", () => {
    expect(() =>
      assertAdminClaims(
        { ...REAL_WORKSPACE_TOKEN, email: "Dev@ThaiShieldApp.COM" },
        DOMAIN,
      ),
    ).not.toThrow();
  });

  describe("rejects", () => {
    it("an unverified email", () => {
      expect(() =>
        assertAdminClaims(
          { ...REAL_WORKSPACE_TOKEN, email_verified: false },
          DOMAIN,
        ),
      ).toThrow(/not verified/);
    });

    it("a token with no email_verified claim at all", () => {
      expect(() =>
        assertAdminClaims(
          { ...REAL_WORKSPACE_TOKEN, email_verified: undefined },
          DOMAIN,
        ),
      ).toThrow(AdminAuthError);
    });

    it("a non-Google sign-in provider", () => {
      expect(() =>
        assertAdminClaims(
          { ...REAL_WORKSPACE_TOKEN, firebase: { sign_in_provider: "password" } },
          DOMAIN,
        ),
      ).toThrow(/must use a Google account/);
    });

    it("a token with no provider information", () => {
      expect(() =>
        assertAdminClaims({ ...REAL_WORKSPACE_TOKEN, firebase: {} }, DOMAIN),
      ).toThrow(/must use a Google account/);
    });

    it("a lookalike domain that merely ends with the allowed one", () => {
      expect(() =>
        assertAdminClaims(
          { ...REAL_WORKSPACE_TOKEN, email: "attacker@notthaishieldapp.com" },
          DOMAIN,
        ),
      ).toThrow(AdminAuthError);
    });

    it("a subdomain of the allowed domain", () => {
      expect(() =>
        assertAdminClaims(
          { ...REAL_WORKSPACE_TOKEN, email: "attacker@mail.thaishieldapp.com" },
          DOMAIN,
        ),
      ).toThrow(AdminAuthError);
    });

    it("an unrelated domain", () => {
      expect(() =>
        assertAdminClaims(
          { ...REAL_WORKSPACE_TOKEN, email: "someone@gmail.com" },
          DOMAIN,
        ),
      ).toThrow(AdminAuthError);
    });

    it("a token carrying no email", () => {
      expect(() =>
        assertAdminClaims(
          { ...REAL_WORKSPACE_TOKEN, email: undefined },
          DOMAIN,
        ),
      ).toThrow(AdminAuthError);
    });
  });

  it("DOCUMENTS A KNOWN GAP: a consumer Google account on the domain is accepted", () => {
    // The previous hd-based check would have caught this; the email-suffix
    // check cannot, because a consumer account and a Workspace account produce
    // identical claims once `hd` is absent. Kept as an explicit, failing-loudly
    // -if-changed record of the tradeoff rather than deleted, since it is the
    // one real security regression from dropping hd. Closing it requires
    // gating on an Admin-SDK custom claim instead — see admin-claims.ts.
    expect(() =>
      assertAdminClaims(
        {
          email: "conflicting-account@thaishieldapp.com",
          email_verified: true,
          firebase: { sign_in_provider: "google.com" },
        },
        DOMAIN,
      ),
    ).not.toThrow();
  });
});
