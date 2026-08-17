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
    risk_level: data.risk_level,
    description_en: data.description_en,
    description_th: data.description_th,
    polygon: polygon.map((p) => ({ lat: p.latitude, lng: p.longitude })),
    center_lat: data.center_lat,
    center_lng: data.center_lng,
    radius_km: data.radius_km,
  };
}

export async function listAlertZones(): Promise<AlertZone[]> {
  await requireAdminSession();
  const snapshot = await getAdminFirestore()
    .collection(COLLECTION)
    .orderBy("name")
    .get();
  return snapshot.docs.map((doc) => fromFirestore(doc.id, doc.data()));
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

    await ref.set({
      id: parsed.id,
      name: parsed.name,
      risk_level: parsed.risk_level,
      description_en: parsed.description_en,
      description_th: parsed.description_th,
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
