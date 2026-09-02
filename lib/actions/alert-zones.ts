"use server";

import { GeoPoint } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { computeBoundingRadiusKm, computePolygonCentroid } from "@/lib/geo/polygon";
import { alertZoneInputSchema, type AlertZone } from "@/lib/schemas/alert-zones";
import { actionError, type ActionResult } from "./action-result";
import { requireAdminSession } from "./require-admin";

const COLLECTION = "alert_zones";
const LIST_PATH = "/admin/alert-zones";

function fromFirestore(id: string, data: FirebaseFirestore.DocumentData): AlertZone {
  const polygon = (data.polygon as GeoPoint[] | undefined) ?? [];
  return {
    id,
    name: data.name,
    name_th: data.name_th ?? "",
    name_zh: data.name_zh ?? "",
    name_ko: data.name_ko ?? "",
    name_ru: data.name_ru ?? "",
    name_ja: data.name_ja ?? "",
    risk_level: data.risk_level,
    description_en: data.description_en,
    description_th: data.description_th,
    // Optional since 2026-09-02, and empty is the normal case — all 193 live
    // zones have none of the four. They read back as "" so the form opens with
    // empty boxes rather than `undefined`, and the app falls back to English
    // for whichever are blank (`AlertZone.localizedDescription`).
    description_zh: data.description_zh ?? "",
    description_ko: data.description_ko ?? "",
    description_ru: data.description_ru ?? "",
    description_ja: data.description_ja ?? "",
    polygon: polygon.map((p) => ({ lat: p.latitude, lng: p.longitude })),
    center_lat: data.center_lat,
    center_lng: data.center_lng,
    radius_km: data.radius_km,
  };
}

/**
 * One row of the zone list — only what the table draws.
 *
 * Not `AlertZone`. There are 193 zones and the full document carries six
 * descriptions and five optional names, none of which the list renders; at
 * that row count the text is most of the payload. `point_count` is derived on
 * the server so the polygon itself never has to be serialised into the page.
 */
export interface AlertZoneListRow {
  id: string;
  name: string;
  risk_level: string;
  radius_km: number;
  point_count: number;
}

export async function listAlertZones(): Promise<AlertZoneListRow[]> {
  await requireAdminSession();

  // 🚨 No `orderBy`. Two reasons, and the first has already cost this project
  // a bug:
  //
  //  - **`orderBy(field)` silently EXCLUDES every document missing that
  //    field.** Ordering `price_standards` by its `id` field dropped all 61
  //    live documents and staff saw an empty table over populated data (see
  //    `price-standards.ts`). `name` is present on every zone today, and that
  //    is exactly the kind of thing that stops being true without anyone
  //    noticing.
  //  - Sorting happens in memory now anyway (`lib/query/list-query.ts`), by
  //    whichever column the user picked, so a server-side order would only be
  //    thrown away.
  //
  // `.select()` keeps the six descriptions and five names out of the response.
  const snapshot = await getAdminFirestore()
    .collection(COLLECTION)
    .select("name", "risk_level", "radius_km", "polygon")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const polygon = (data.polygon as GeoPoint[] | undefined) ?? [];
    return {
      id: doc.id,
      name: (data.name as string | undefined) ?? "",
      risk_level: (data.risk_level as string | undefined) ?? "",
      // Defaulted rather than trusted: a zone seeded before the CMS existed
      // may have no derived fields, and `undefined.toFixed()` would take the
      // whole page down over one bad row.
      radius_km: (data.radius_km as number | undefined) ?? 0,
      point_count: polygon.length,
    };
  });
}

export async function getAlertZone(id: string): Promise<AlertZone | null> {
  await requireAdminSession();
  const doc = await getAdminFirestore().collection(COLLECTION).doc(id).get();
  return doc.exists ? fromFirestore(doc.id, doc.data()!) : null;
}

export async function saveAlertZone(
  input: unknown,
  mode: "create" | "edit",
  originalId?: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const parsed = alertZoneInputSchema.parse(input);

    if (mode === "edit" && originalId && parsed.id !== originalId) {
      return { ok: false, error: "Alert zone ID cannot be changed." };
    }

    const ref = getAdminFirestore().collection(COLLECTION).doc(parsed.id);

    if (mode === "create") {
      const existing = await ref.get();
      if (existing.exists) {
        return {
          ok: false,
          error: `An alert zone with id "${parsed.id}" already exists.`,
        };
      }
    }

    // WEB_ADMIN.md §3: compute/store center_lat/center_lng (polygon
    // centroid) and the legacy radius_km alongside the raw polygon array.
    const centroid = computePolygonCentroid(parsed.polygon);
    const radiusKm = computeBoundingRadiusKm(centroid, parsed.polygon);

    // 🚨 **Spread `parsed`. Do not go back to listing fields by hand.**
    //
    // This block used to name each field individually, and it named nine fewer
    // than the schema validates: `description_zh`, `description_ko`,
    // `description_ru`, `description_ja` and all five optional `name_*`
    // fields. The form collected them, the schema *required* four of them and
    // rejected a save without them — and then the write silently dropped them.
    //
    // The client found it by using the product (2026-09-02): they filled in
    // Chinese, Korean, Russian and Japanese, saved, reopened the zone and
    // found only Thai and English had stuck. Nothing failed. No error, no
    // warning, and `getAlertZone` reads those four with `?? ""`, so the form
    // reopened looking like the text had simply never been typed.
    //
    // It was worse than a dropped write, because `.set()` REPLACES the
    // document: a zone that already had the four translations lost them the
    // next time anyone edited it for an unrelated reason.
    //
    // A hand-written payload has to be updated every time the schema grows,
    // and nothing makes that happen — not the type system (extra schema keys
    // are simply absent from the object literal, which is valid), not
    // `tsc --noEmit`, and not the tests, which checked the polygon and the
    // wording rules but never that the text staff type comes back. The other
    // two modules spread `...parsed` and never had this bug.
    //
    // `polygon` and the three derived fields are overridden *after* the
    // spread: the schema's polygon is `{lat,lng}[]` and Firestore must hold
    // `GeoPoint[]` (CLAUDE.md §3 — the app casts, and a map silently yields an
    // empty overlay).
    await ref.set({
      ...parsed,
      polygon: parsed.polygon.map((p) => new GeoPoint(p.lat, p.lng)),
      center_lat: centroid.lat,
      center_lng: centroid.lng,
      radius_km: radiusKm,
    });

    revalidatePath(LIST_PATH);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteAlertZone(id: string): Promise<ActionResult> {
  try {
    await requireAdminSession();
    await getAdminFirestore().collection(COLLECTION).doc(id).delete();
    revalidatePath(LIST_PATH);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteAlertZoneFormAction(
  formData: FormData,
): Promise<ActionResult> {
  return deleteAlertZone(String(formData.get("id") ?? ""));
}
