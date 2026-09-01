"use server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  LIST_LIMIT,
  toAppUserRow,
  toPurchaseTransactionRow,
  type AppUserRow,
  type PurchaseTransactionRow,
} from "@/lib/schemas/reporting";
import { requireAdminSession } from "./require-admin";

const USERS_COLLECTION = "app_users";
const TRANSACTIONS_COLLECTION = "purchase_transactions";

/**
 * Installs, most recently active first.
 *
 * 🚨 **Ordering by `last_seen_at` silently drops every document that lacks
 * it.** That is not a hypothetical: ordering `price_standards` by its `id`
 * field excluded all 61 live documents and staff saw an empty table over
 * populated data (see `lib/actions/price-standards.ts`). Every write from
 * `FirestoreActivityLog.recordActivity` sets `last_seen_at`, so nothing is
 * lost today — but if a future app version ever stops sending it, those rows
 * vanish from this page rather than appearing without a date. Order by a field
 * the writer always writes.
 */
export async function listAppUsers(): Promise<AppUserRow[]> {
  await requireAdminSession();

  const snapshot = await getAdminFirestore()
    .collection(USERS_COLLECTION)
    .orderBy("last_seen_at", "desc")
    .limit(LIST_LIMIT)
    .get();

  return snapshot.docs.map((doc) => toAppUserRow(doc.id, doc.data()));
}

/**
 * Store transactions, newest first.
 *
 * Ordered by `recorded_at` — our server timestamp — rather than `purchased_at`,
 * which comes from the store and is absent on some platforms and on every
 * restore. Ordering by a field that is frequently missing would drop exactly
 * the rows a support question is about.
 */
export async function listPurchaseTransactions(): Promise<
  PurchaseTransactionRow[]
> {
  await requireAdminSession();

  const snapshot = await getAdminFirestore()
    .collection(TRANSACTIONS_COLLECTION)
    .orderBy("recorded_at", "desc")
    .limit(LIST_LIMIT)
    .get();

  return snapshot.docs.map((doc) =>
    toPurchaseTransactionRow(doc.id, doc.data()),
  );
}

/**
 * Every transaction filed by one install, newest first.
 *
 * Lets the App Users page link a row to the purchases behind it, which is the
 * one join the client will actually want: "this install says Premium — what
 * did they buy?".
 *
 * Needs no composite index: a single equality filter combined with an
 * `orderBy` on a different field does require one in general, so this sorts in
 * memory instead. The result set is one install's purchases — a handful of
 * rows at most, and bounded by {@link LIST_LIMIT} regardless.
 */
export async function listTransactionsForInstall(
  installId: string,
): Promise<PurchaseTransactionRow[]> {
  await requireAdminSession();

  const snapshot = await getAdminFirestore()
    .collection(TRANSACTIONS_COLLECTION)
    .where("install_id", "==", installId)
    .limit(LIST_LIMIT)
    .get();

  return snapshot.docs
    .map((doc) => toPurchaseTransactionRow(doc.id, doc.data()))
    .sort((a, b) => (b.recordedAt ?? 0) - (a.recordedAt ?? 0));
}
