"use server";

import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  priceStandardInputSchema,
  type PriceStandard,
} from "@/lib/schemas/price-standards";
import { actionError, type ActionResult } from "./action-result";
import { requireAdminSession } from "./require-admin";

const COLLECTION = "price_standards";
const LIST_PATH = "/admin/price-standards";

/**
 * Rebuilds a document with `id` taken from the document ID instead of the
 * stored field. All 61 production documents were written by the pre-CMS seed
 * script and carry no `id` field at all, which used to leave `initial.id`
 * undefined on the edit form and made those rows unsaveable. The document ID
 * *is* the id by contract (CLAUDE.md §3), so read it from there and stop
 * depending on the data being well-formed. Mirrors alert-zones.
 */
function fromFirestore(
  id: string,
  data: FirebaseFirestore.DocumentData,
): PriceStandard {
  // 🚨 Build this explicitly. Do not go back to `{ ...data, id }`.
  //
  // Everything returned here is handed to `<PriceStandardForm>`, which is a
  // Client Component, and React can only carry plain objects across that
  // boundary. `price_standards` is the only one of the three collections that
  // stores `updated_at`, and it reads back as a Firestore `Timestamp` — a
  // class. Spreading the raw document put that class on the props and threw
  // "Only plain objects can be passed to Client Components" for every row, so
  // the edit page failed to open at all.
  //
  // The type system could not see it: the form's prop is typed
  // `PriceStandardInput`, `PriceStandard` extends it, and TypeScript permits
  // the extra property when a variable is passed rather than an object
  // literal. `tsc --noEmit` was clean the whole time.
  //
  // `updated_at` is write-only — nothing in the CMS displays it and both write
  // paths re-stamp it from the server — so it simply does not belong in the
  // read model. Mirrors alert-zones, which builds its object field by field
  // and never had this problem.
  const item: PriceStandard = {
    id,
    name_en: data.name_en,
    name_th: data.name_th,
    name_zh: data.name_zh,
    name_ko: data.name_ko,
    name_ru: data.name_ru,
    name_ja: data.name_ja,
    min_price: data.min_price,
    max_price: data.max_price,
    category: data.category,
  };

  // Carried so the update path can write it back; see updatePriceStandard.
  if (typeof data.image_url === "string") item.image_url = data.image_url;

  return item;
}

export async function listPriceStandards(): Promise<PriceStandard[]> {
  await requireAdminSession();
  // Ordering by the `id` FIELD silently dropped every document that lacks it —
  // i.e. all 61 live ones — so staff saw an empty table over populated data.
  // The document ID is always present and equals `id`, so order by that.
  const snapshot = await getAdminFirestore()
    .collection(COLLECTION)
    .orderBy(FieldPath.documentId())
    .get();
  return snapshot.docs.map((doc) => fromFirestore(doc.id, doc.data()));
}

export async function getPriceStandard(
  id: string,
): Promise<PriceStandard | null> {
  await requireAdminSession();
  const doc = await getAdminFirestore().collection(COLLECTION).doc(id).get();
  return doc.exists ? fromFirestore(doc.id, doc.data()!) : null;
}

export async function createPriceStandard(
  input: unknown,
): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const parsed = priceStandardInputSchema.parse(input);
    const ref = getAdminFirestore().collection(COLLECTION).doc(parsed.id);

    const existing = await ref.get();
    if (existing.exists) {
      return {
        ok: false,
        error: `A price standard with id "${parsed.id}" already exists.`,
      };
    }

    await ref.set({ ...parsed, updated_at: FieldValue.serverTimestamp() });
    revalidatePath(LIST_PATH);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updatePriceStandard(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const parsed = priceStandardInputSchema.parse(input);
    if (parsed.id !== id) {
      return { ok: false, error: "Price standard ID cannot be changed." };
    }

    const ref = getAdminFirestore().collection(COLLECTION).doc(id);

    // `.set()` REPLACES the document. `image_url` is not part of this form's
    // schema but every seeded dish has one, and the Flutter Scanner uses it as
    // the result card's background photo (scanner_screen.dart `_ResultHeader`).
    // Without this carry-over, a staff member editing a price silently deletes
    // that photo for every tourist. Read it back and keep it.
    const existing = await ref.get();
    const previousImageUrl = existing.exists
      ? (existing.data() as { image_url?: unknown }).image_url
      : undefined;

    await ref.set({
      ...parsed,
      ...(typeof previousImageUrl === "string"
        ? { image_url: previousImageUrl }
        : {}),
      updated_at: FieldValue.serverTimestamp(),
    });
    revalidatePath(LIST_PATH);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deletePriceStandard(id: string): Promise<ActionResult> {
  try {
    await requireAdminSession();
    await getAdminFirestore().collection(COLLECTION).doc(id).delete();
    revalidatePath(LIST_PATH);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

/** FormData wrapper — reads the id from a hidden field so the caller does not
 * need `.bind()`. Returns the result rather than void so DeleteRowButton can
 * tell the user whether the delete actually happened. */
export async function deletePriceStandardFormAction(
  formData: FormData,
): Promise<ActionResult> {
  return deletePriceStandard(String(formData.get("id") ?? ""));
}
