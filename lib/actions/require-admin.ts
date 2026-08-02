import "server-only";
import { getAdminSession } from "@/lib/auth/session";

export class UnauthorizedActionError extends Error {
  constructor() {
    super("You must be signed in as an admin to perform this action.");
    this.name = "UnauthorizedActionError";
  }
}

/**
 * Every Server Action that reads/writes Firestore must call this first —
 * per WEB_ADMIN.md §4, the session is re-verified on every action, not
 * just gated once at the /admin layout level.
 */
export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    throw new UnauthorizedActionError();
  }
  return session;
}
