"use server";

import { FieldValue } from "firebase-admin/firestore";
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

export async function listPriceStandards(): Promise<PriceStandard[]> {
  await requireAdminSession();
  const snapshot = await getAdminFirestore()
    .collection(COLLECTION)
    .orderBy("id")
    .get();
  return snapshot.docs.map((doc) => doc.data() as PriceStandard);
}

export async function getPriceStandard(
  id: string,
): Promise<PriceStandard | null> {
  await requireAdminSession();
  const doc = await getAdminFirestore().collection(COLLECTION).doc(id).get();
  return doc.exists ? (doc.data() as PriceStandard) : null;
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

    await getAdminFirestore()
      .collection(COLLECTION)
      .doc(id)
      .set({ ...parsed, updated_at: FieldValue.serverTimestamp() });
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

/** Plain `<form action={...}>` wrapper — reads the id from a hidden input so the
 * form action type stays `(formData: FormData) => Promise<void>`, avoiding the
 * `.bind()` + non-void-return typing mismatch. */
export async function deletePriceStandardFormAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  await deletePriceStandard(id);
}
