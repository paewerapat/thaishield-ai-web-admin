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
 * Enforces WEB_ADMIN.md §4: only @<allowedDomain> accounts may use this admin.
 *
 * RESOLVED (was STATUS.md item #1): this originally keyed solely off Google's
 * `hd` (hosted domain) claim. Confirmed against a real Workspace sign-in that
 * **Firebase does not forward `hd` onto its own ID token** — it is absent
 * entirely, so the check rejected every account including valid ones. Firebase
 * passes through only its own claim set (`firebase.identities`,
 * `firebase.sign_in_provider`) plus the standard OIDC ones; provider-specific
 * claims like `hd` do not survive the exchange.
 *
 * So the check is now: a verified email, signed in through Google, whose
 * address is on the allowed domain. `hd` is still honoured when present — if
 * Firebase ever starts forwarding it, a mismatch is a strong signal of a
 * different Workspace tenant and is rejected outright.
 *
 * KNOWN RESIDUAL RISK: the email-suffix test is weaker than a true `hd` check
 * because it cannot distinguish a Workspace account from a consumer Google
 * account bearing the same address. In practice Google refuses consumer signup
 * on a domain an active Workspace tenant has claimed, but pre-existing
 * "conflicting accounts" (created before the domain joined Workspace) are the
 * real gap. To close it properly, gate on a custom claim minted by the Admin
 * SDK for named admins rather than on the email domain at all — see STATUS.md.
 */
export function assertAdminClaims(
  claims: AdminTokenClaims,
  allowedDomain: string,
): void {
  if (!claims.email_verified) {
    throw new AdminAuthError("Google account email is not verified.");
  }

  if (claims.firebase?.sign_in_provider !== "google.com") {
    throw new AdminAuthError("Sign-in must use a Google account.");
  }

  // Only meaningful if Firebase starts forwarding it; a present-but-wrong `hd`
  // means a different Workspace tenant, which the email test alone could miss
  // if that tenant also owns an alias on this domain.
  if (claims.hd !== undefined && claims.hd !== allowedDomain) {
    throw new AdminAuthError(
      `Access restricted to @${allowedDomain} Google Workspace accounts.`,
    );
  }

  // Lowercased because the domain half of an address is case-insensitive, and
  // the leading "@" is part of the suffix so that a lookalike domain such as
  // "notthaishieldapp.com" — or a subdomain like "x.thaishieldapp.com" — fails.
  const email = claims.email?.toLowerCase();
  if (!email || !email.endsWith(`@${allowedDomain.toLowerCase()}`)) {
    throw new AdminAuthError(
      `Access restricted to @${allowedDomain} Google Workspace accounts.`,
    );
  }
}
