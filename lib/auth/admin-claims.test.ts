import { describe, expect, it } from "vitest";
import { AdminAuthError, assertAdminClaims } from "./admin-claims";

const DOMAIN = "thaishieldapp.com";

describe("assertAdminClaims", () => {
  it("does not throw for a verified email on the allowed domain", () => {
    expect(() =>
      assertAdminClaims(
        { email: "staff@thaishieldapp.com", email_verified: true, hd: DOMAIN },
        DOMAIN,
      ),
    ).not.toThrow();
  });

  it("throws AdminAuthError when the hd claim is missing", () => {
    expect(() =>
      assertAdminClaims(
        { email: "someone@thaishieldapp.com", email_verified: true },
        DOMAIN,
      ),
    ).toThrow(AdminAuthError);
  });

  it("throws when hd is a different domain", () => {
    expect(() =>
      assertAdminClaims(
        {
          email: "someone@thaishieldapp.com",
          email_verified: true,
          hd: "gmail.com",
        },
        DOMAIN,
      ),
    ).toThrow(/Access restricted to @thaishieldapp\.com/);
  });

  it("throws when email_verified is false, even with a matching hd", () => {
    expect(() =>
      assertAdminClaims(
        { email: "staff@thaishieldapp.com", email_verified: false, hd: DOMAIN },
        DOMAIN,
      ),
    ).toThrow(/not verified/);
  });

  it("throws when email_verified is undefined", () => {
    expect(() => assertAdminClaims({ hd: DOMAIN }, DOMAIN)).toThrow(
      AdminAuthError,
    );
  });

  it("rejects a consumer Google account merely using a matching email, since hd is absent", () => {
    // This is the exact scenario WEB_ADMIN.md §4 flags: someone who can
    // receive mail at the domain creates a personal (non-Workspace)
    // Google account with that address. It passes email_verified but
    // never carries a matching `hd`.
    expect(() =>
      assertAdminClaims(
        { email: "attacker@thaishieldapp.com", email_verified: true },
        DOMAIN,
      ),
    ).toThrow(AdminAuthError);
  });
});
