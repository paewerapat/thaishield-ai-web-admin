"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getDownloadURL } from "firebase-admin/storage";
import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin";
import {
  bucketMissingMessage,
  isBucketMissingError,
} from "@/lib/storage-errors";
import {
  assertValidImageFile,
  extensionForImageType,
  partnerLocationInputSchema,
  type PartnerLocation,
} from "@/lib/schemas/partner-locations";
import { actionError, type ActionResult } from "./action-result";
import { requireAdminSession } from "./require-admin";

const COLLECTION = "partner_locations";
const LIST_PATH = "/admin/partner-locations";

/**
 * Rebuilds a document with `id` taken from the document ID instead of the
 * stored field. 5 of the 6 production documents were written by the pre-CMS
 * seed script and carry no `id`, which left the (disabled) ID input empty on
 * the edit form and made Zod reject the save with "ID is required" — those
 * rows could not be edited at all. The document ID is the id by contract
 * (CLAUDE.md §3). Mirrors alert-zones.
 */
function fromFirestore(
  id: string,
  data: FirebaseFirestore.DocumentData,
): PartnerLocation {
  return { ...data, id } as PartnerLocation;
}

export async function listPartnerLocations(): Promise<PartnerLocation[]> {
  await requireAdminSession();
  const snapshot = await getAdminFirestore()
    .collection(COLLECTION)
    .orderBy("name")
    .get();
  return snapshot.docs.map((doc) => fromFirestore(doc.id, doc.data()));
}

export async function getPartnerLocation(
  id: string,
): Promise<PartnerLocation | null> {
  await requireAdminSession();
  const doc = await getAdminFirestore().collection(COLLECTION).doc(id).get();
  return doc.exists ? fromFirestore(doc.id, doc.data()!) : null;
}

/**
 * Uploads a real partner photo to Firebase Storage (WEB_ADMIN.md §2/§3 —
 * replaces the Flutter app's current hotlinked Pexels placeholders) and
 * returns a download URL to store as `image_url`.
 *
 * Readability comes from a Firebase **download token**, not from an ACL. The
 * obvious `makePublic()` throws "Cannot update access control for an object
 * when uniform bucket-level access is enabled" — UBLA is on by default for
 * buckets Firebase creates now, and it disables per-object ACLs outright.
 *
 * Granting `allUsers` read at the bucket level is not the way out either: this
 * organization is on Google's secure-by-default baseline (the same bundle that
 * blocks service account key creation — see STATUS.md), which enforces
 * `storage.publicAccessPrevention`.
 *
 * A download token sidesteps both. The resulting URL is unguessable but needs
 * no authentication and bypasses Storage rules, which is exactly right here:
 * the Flutter app has no auth and must render these photos for anonymous
 * tourists. Tokens do not expire; revoke one from the Firebase Console if a
 * photo ever has to be pulled.
 */
async function uploadPartnerImage(id: string, file: File): Promise<string> {
  assertValidImageFile(file);

  const extension = extensionForImageType(file.type);
  const storagePath = `partner_locations/${id}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const downloadToken = randomUUID();

  const bucket = getAdminStorage().bucket();
  const storageFile = bucket.file(storagePath);

  try {
    await storageFile.save(buffer, {
      contentType: file.type,
      metadata: {
        contentType: file.type,
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      },
    });
  } catch (cause) {
    // Raw GCS returns `{"error":{"code":404,"message":"The specified bucket
    // does not exist."}}` — which names neither the bucket nor the fix, and
    // lands in front of non-technical staff as a JSON blob.
    if (isBucketMissingError(cause)) {
      throw new Error(bucketMissingMessage(bucket.name), { cause });
    }
    throw cause;
  }

  // Reads the token back from the stored object rather than formatting the URL
  // from `downloadToken` locally. If the metadata failed to persist under that
  // exact key, this throws here — where staff see it — instead of returning a
  // well-formed URL that 403s the first time a tourist opens the map.
  return getDownloadURL(storageFile);
}

function extractFields(formData: FormData) {
  return {
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    lat: String(formData.get("lat") ?? ""),
    lng: String(formData.get("lng") ?? ""),
    type: String(formData.get("type") ?? ""),
    rating: String(formData.get("rating") ?? ""),
    is_verified: formData.get("is_verified") === "true",
    price_tier: String(formData.get("price_tier") ?? ""),
    image_url: String(formData.get("existing_image_url") ?? ""),
  };
}

export async function savePartnerLocation(
  formData: FormData,
  mode: "create" | "edit",
  originalId?: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const fields = extractFields(formData);
    const parsed = partnerLocationInputSchema.parse(fields);

    if (mode === "edit" && originalId && parsed.id !== originalId) {
      return { ok: false, error: "Partner location ID cannot be changed." };
    }

    const ref = getAdminFirestore().collection(COLLECTION).doc(parsed.id);

    if (mode === "create") {
      const existing = await ref.get();
      if (existing.exists) {
        return {
          ok: false,
          error: `A partner location with id "${parsed.id}" already exists.`,
        };
      }
    }

    const imageFile = formData.get("image");
    let imageUrl = parsed.image_url;
    if (imageFile instanceof File && imageFile.size > 0) {
      imageUrl = await uploadPartnerImage(parsed.id, imageFile);
    }

    await ref.set({ ...parsed, image_url: imageUrl });
    revalidatePath(LIST_PATH);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deletePartnerLocation(id: string): Promise<ActionResult> {
  try {
    await requireAdminSession();
    await getAdminFirestore().collection(COLLECTION).doc(id).delete();
    revalidatePath(LIST_PATH);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deletePartnerLocationFormAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  await deletePartnerLocation(id);
}
