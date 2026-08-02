/**
 * Single source of truth for both the client-side `hd` OAuth hint
 * (lib/firebase/client.ts) and the server-side enforcement check
 * (lib/auth/admin-claims.ts) — see WEB_ADMIN.md §4.
 */
export const ADMIN_ALLOWED_DOMAIN =
  process.env.NEXT_PUBLIC_ADMIN_ALLOWED_DOMAIN || "thaishieldapp.com";
