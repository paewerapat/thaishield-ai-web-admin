export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export interface AdminTokenClaims {
  email?: string;
  email_verified?: boolean;
  hd?: string;
  firebase?: {
    sign_in_provider?: string;
  };
}

/**
 * Enforces WEB_ADMIN.md §4: only @<allowedDomain> Google Workspace
 * accounts may use this admin, verified via the `hd` (hosted domain)
 * claim rather than a raw string match on `email` — closes the loophole
 * where a consumer (non-Workspace) Google account could be created using
 * a custom-domain email address someone merely has mailbox access to.
 *
 * UNVERIFIED ASSUMPTION — see STATUS.md: this assumes Firebase forwards
 * Google's `hd` claim onto its own decoded ID token unchanged. That has
 * not been confirmed against a real Google Workspace sign-in yet (needs
 * real Firebase secrets). If `hd` turns out to never be present on
 * Firebase-issued tokens, the fallback is to additionally accept:
 * `email_verified === true AND firebase.sign_in_provider === "google.com"
 * AND email.endsWith("@" + allowedDomain)` — weaker (doesn't rule out a
 * consumer Google account merely using that email) but functional.
 */
export function assertAdminClaims(
  claims: AdminTokenClaims,
  allowedDomain: string,
): void {
  if (!claims.email_verified) {
    throw new AdminAuthError("Google account email is not verified.");
  }
  if (claims.hd !== allowedDomain) {
    throw new AdminAuthError(
      `Access restricted to @${allowedDomain} Google Workspace accounts.`,
    );
  }
}
