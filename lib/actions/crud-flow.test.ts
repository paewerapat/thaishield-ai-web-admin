/**
 * End-to-end CRUD flow tests for all three collections, run against an
 * in-memory Firestore stand-in.
 *
 * The existing suites cover the Zod schemas in isolation; these cover the
 * Server Actions themselves — the layer that decides what actually lands in
 * Firestore. That matters because the Flutter app parses those documents
 * directly (CLAUDE.md §3), so a wrong field name, a lat/lng map where a
 * GeoPoint belongs, or a missing `updated_at` is an app bug, not just a CMS
 * bug. Every assertion below is written from the app's point of view.
 *
 * The fake store reproduces the two Firestore behaviours these actions depend
 * on: `.set()` fully replaces a document, and `.orderBy(field)` silently
 * EXCLUDES documents that lack that field.
 *
 * No credentials, no network — safe to run in CI and on a laptop with no
 * `.env.local`. What it deliberately does not cover: Firebase Auth, the real
 * Admin SDK transport, and Storage IO. Those need the live smoke test in
 * `../INTEGRATION_TEST.md` (workspace root, next to both repos).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FieldPath, FieldValue, GeoPoint, Timestamp } from "firebase-admin/firestore";

// --- In-memory Firestore ----------------------------------------------------

type Doc = Record<string, unknown>;
/** collection name -> document id -> document data */
let store: Record<string, Record<string, Doc>> = {};

const FIXED_SERVER_TIME = Timestamp.fromDate(new Date("2026-08-14T00:00:00Z"));

function collectionMap(name: string): Record<string, Doc> {
  if (!store[name]) store[name] = {};
  return store[name]!;
}

const idsIn = (collection: string) => Object.keys(collectionMap(collection));
const sizeOf = (collection: string) => idsIn(collection).length;

/** Firestore resolves serverTimestamp() sentinels server-side; do the same. */
function resolveSentinels(data: Doc): Doc {
  const out: Doc = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = v instanceof FieldValue ? FIXED_SERVER_TIME : v;
  }
  return out;
}

function fakeFirestore() {
  return {
    collection(name: string) {
      const docs = collectionMap(name);
      /**
       * `orderField` is either a field name or `FieldPath.documentId()`. The
       * distinction is the whole point of these tests: ordering by a FIELD
       * drops documents that lack it, ordering by the DOCUMENT ID cannot,
       * because every document has one.
       */
      const query = (orderField: string | FieldPath) => {
        const byDocumentId = orderField instanceof FieldPath;
        const keyOf = (entry: { id: string; data: Doc }) =>
          byDocumentId ? entry.id : entry.data[orderField as string];
        return {
          async get() {
            const entries = Object.keys(docs)
              .map((id) => ({ id, data: docs[id]! }))
              // Firestore drops documents that do not contain the ordered field.
              .filter((entry) => keyOf(entry) !== undefined)
              .sort((a, b) => String(keyOf(a)).localeCompare(String(keyOf(b))));
            return {
              docs: entries.map((e) => ({ id: e.id, data: () => e.data })),
            };
          },
        };
      };
      return {
        orderBy: (field: string | FieldPath) => query(field),
        doc(id: string) {
          return {
            async get() {
              const data = docs[id];
              // `id` matters: the actions read it off the snapshot rather than
              // trusting the stored `id` field, which seeded documents lack.
              return { id, exists: data !== undefined, data: () => data };
            },
            async set(data: Doc) {
              docs[id] = resolveSentinels(data);
            },
            async delete() {
              delete docs[id];
            },
          };
        },
      };
    },
  };
}

const savedFiles: { path: string; contentType: string; token: string }[] = [];

vi.mock("@/lib/firebase/admin", () => ({
  getAdminFirestore: () => fakeFirestore(),
  getAdminStorage: () => ({
    bucket: () => ({
      name: "thaishield-ai-790eb.firebasestorage.app",
      file: (path: string) => ({
        name: path,
        async save(
          _buffer: Buffer,
          options: { contentType: string; metadata: { metadata: Record<string, string> } },
        ) {
          savedFiles.push({
            path,
            contentType: options.contentType,
            token: options.metadata.metadata.firebaseStorageDownloadTokens,
          });
        },
      }),
    }),
  }),
}));

vi.mock("firebase-admin/storage", () => ({
  getDownloadURL: async (file: { name: string }) =>
    `https://firebasestorage.googleapis.com/v0/b/thaishield-ai-790eb.firebasestorage.app/o/${encodeURIComponent(file.name)}?alt=media&token=fake-token`,
}));

// Auth is exercised by lib/auth/admin-claims.test.ts; here every caller is a
// signed-in admin so the CRUD path itself is what's under test.
vi.mock("./require-admin", () => ({
  requireAdminSession: async () => ({ uid: "test-uid", email: "dev@thaishieldapp.com" }),
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import {
  createPriceStandard,
  deletePriceStandard,
  getPriceStandard,
  listPriceStandards,
  updatePriceStandard,
} from "./price-standards";
import {
  deletePartnerLocation,
  getPartnerLocation,
  listPartnerLocations,
  savePartnerLocation,
} from "./partner-locations";
import {
  deleteAlertZone,
  getAlertZone,
  listAlertZones,
  saveAlertZone,
} from "./alert-zones";

// --- Fixtures ---------------------------------------------------------------

const priceInput = (overrides: Record<string, unknown> = {}) => ({
  id: "zz_test_dish",
  name_en: "Test Dish",
  name_th: "เมนูทดสอบ",
  name_zh: "测试菜",
  name_ko: "테스트 요리",
  name_ru: "Тестовое блюдо",
  name_ja: "テスト料理",
  min_price: 40,
  max_price: 80,
  category: "food",
  ...overrides,
});

function partnerForm(overrides: Partial<Record<string, string>> = {}): FormData {
  const fd = new FormData();
  const fields: Record<string, string> = {
    id: "zz_test_partner",
    name: "Test Partner Cafe",
    lat: "13.7563",
    lng: "100.5018",
    type: "restaurant",
    rating: "4.5",
    is_verified: "true",
    price_tier: "fair",
    existing_image_url: "",
    ...overrides,
  };
  for (const [k, v] of Object.entries(fields)) fd.set(k, String(v));
  return fd;
}

const SQUARE = [
  { lat: 13.75, lng: 100.5 },
  { lat: 13.76, lng: 100.5 },
  { lat: 13.76, lng: 100.51 },
  { lat: 13.75, lng: 100.51 },
];

const zoneInput = (overrides: Record<string, unknown> = {}) => ({
  id: "zz_test_zone",
  name: "Test Advisory Area",
  polygon: SQUARE,
  risk_level: "caution",
  description_en: "Prices in this area vary more than the city average.",
  description_th: "ราคาบริเวณนี้แตกต่างจากค่าเฉลี่ยของเมืองมากกว่าปกติ",
  ...overrides,
});

const docsOf = (collection: string) => collectionMap(collection);
const docIn = (collection: string, id: string) => collectionMap(collection)[id];

beforeEach(() => {
  store = {};
  savedFiles.length = 0;
});

// --- price_standards --------------------------------------------------------

describe("price_standards CRUD", () => {
  it("writes exactly the document shape PriceStandard.fromFirestore reads", async () => {
    expect(await createPriceStandard(priceInput())).toEqual({ ok: true });

    const doc = docIn("price_standards", "zz_test_dish")!;
    expect(doc).toBeDefined();
    // The app keys off doc.id but the CMS list orders by the `id` FIELD —
    // both must be present and equal (CLAUDE.md §3).
    expect(doc.id).toBe("zz_test_dish");
    for (const f of [
      "name_en",
      "name_th",
      "name_zh",
      "name_ko",
      "name_ru",
      "name_ja",
    ]) {
      expect(typeof doc[f]).toBe("string");
    }
    expect(doc.min_price).toBe(40);
    expect(doc.max_price).toBe(80);
    expect(doc.category).toBe("food");
    // Server-side timestamp only — never a client-supplied value.
    expect(doc.updated_at).toBeInstanceOf(Timestamp);
    // No stray fields the app's schema does not know about.
    expect(Object.keys(doc).sort()).toEqual(
      [
        "category",
        "id",
        "max_price",
        "min_price",
        "name_en",
        "name_ja",
        "name_ko",
        "name_ru",
        "name_th",
        "name_zh",
        "updated_at",
      ].sort(),
    );
  });

  it("refuses to overwrite an existing id on create", async () => {
    await createPriceStandard(priceInput());
    const second = await createPriceStandard(
      priceInput({ name_en: "Different Dish" }),
    );
    expect(second.ok).toBe(false);
    expect(docIn("price_standards", "zz_test_dish")!.name_en).toBe(
      "Test Dish",
    );
  });

  it("rejects invalid input instead of writing a partial document", async () => {
    const cases: Record<string, unknown>[] = [
      { id: "Not Valid ID" },
      { min_price: 100, max_price: 50 },
      { name_th: "" },
      { category: "drinks" },
      { min_price: -1 },
    ];
    for (const override of cases) {
      const result = await createPriceStandard(priceInput(override));
      expect(result.ok, JSON.stringify(override)).toBe(false);
    }
    expect(sizeOf("price_standards")).toBe(0);
  });

  it("updates in place, refreshes updated_at, and refuses an id change", async () => {
    await createPriceStandard(priceInput());
    expect(
      await updatePriceStandard("zz_test_dish", priceInput({ max_price: 95 })),
    ).toEqual({ ok: true });
    const doc = docIn("price_standards", "zz_test_dish")!;
    expect(doc.max_price).toBe(95);
    expect(doc.updated_at).toBeInstanceOf(Timestamp);

    const renamed = await updatePriceStandard(
      "zz_test_dish",
      priceInput({ id: "zz_test_dish_renamed" }),
    );
    expect(renamed.ok).toBe(false);
    expect(idsIn("price_standards")).not.toContain("zz_test_dish_renamed");
  });

  it("deletes the document", async () => {
    await createPriceStandard(priceInput());
    expect(await deletePriceStandard("zz_test_dish")).toEqual({ ok: true });
    expect(sizeOf("price_standards")).toBe(0);
  });

  it("lists what it wrote, ordered by id", async () => {
    await createPriceStandard(priceInput({ id: "zz_b_dish" }));
    await createPriceStandard(priceInput({ id: "zz_a_dish" }));
    expect((await listPriceStandards()).map((p) => p.id)).toEqual([
      "zz_a_dish",
      "zz_b_dish",
    ]);
  });

  it("lists documents that carry no `id` field (was F1: empty table over live data)", async () => {
    // Regression guard for ../INTEGRATION_TEST.md §F1. All 61 live
    // price_standards documents were written by the pre-CMS seed script, which
    // omits `id`. Ordering by that FIELD made Firestore exclude every one of
    // them and the CMS rendered an empty table over data the app was serving.
    // Ordering by the document ID cannot drop anything.
    docsOf("price_standards")["legacy_seeded_dish"] = {
      name_en: "Seeded Dish",
      min_price: 40,
      max_price: 80,
      category: "food",
    };
    await createPriceStandard(priceInput());

    const listed = (await listPriceStandards()).map((p) => p.id);
    expect(listed).toEqual(["legacy_seeded_dish", "zz_test_dish"]);
  });

  it("fills `id` from the document ID so a seeded dish is editable (was F1/F3)", async () => {
    // The edit form disables the ID input and feeds `initial.id` straight back
    // into Zod. Reading `id` off the stored data left it undefined for seeded
    // documents, so saving failed with "ID is required" and those rows could
    // never be edited.
    docsOf("price_standards")["legacy_seeded_dish"] = {
      name_en: "Seeded Dish",
      min_price: 40,
      max_price: 80,
      category: "food",
    };

    const fetched = await getPriceStandard("legacy_seeded_dish");
    expect(fetched?.id).toBe("legacy_seeded_dish");
  });

  it("keeps the `image_url` reference photo when a dish is saved (was F4)", async () => {
    // Regression guard for ../INTEGRATION_TEST.md §F4. priceStandardInputSchema
    // has no image_url and the action writes with .set(), which REPLACES the
    // document — so the first CMS edit used to delete the photo the Scanner
    // result screen renders as its background (scanner_screen.dart
    // `_ResultHeader`). The update path now carries the stored value forward.
    const photo = "https://images.pexels.com/photos/2347311/photo.jpeg";
    docsOf("price_standards")["zz_test_dish"] = {
      ...priceInput(),
      image_url: photo,
    };

    await updatePriceStandard("zz_test_dish", priceInput({ max_price: 90 }));

    const doc = docIn("price_standards", "zz_test_dish")!;
    expect(doc.max_price).toBe(90);
    expect(doc.image_url).toBe(photo);
  });

  it("does not invent an `image_url` for a dish that never had one", async () => {
    await createPriceStandard(priceInput());
    await updatePriceStandard("zz_test_dish", priceInput({ max_price: 90 }));

    expect(docIn("price_standards", "zz_test_dish")!.image_url).toBeUndefined();
  });
});

// --- partner_locations ------------------------------------------------------

describe("partner_locations CRUD", () => {
  it("writes exactly the document shape PartnerLocation.fromFirestore reads", async () => {
    expect(await savePartnerLocation(partnerForm(), "create")).toEqual({
      ok: true,
    });

    const doc = docIn("partner_locations", "zz_test_partner")!;
    expect(doc.id).toBe("zz_test_partner");
    expect(doc.name).toBe("Test Partner Cafe");
    // Form values arrive as strings; the app reads them as num/bool.
    expect(typeof doc.lat).toBe("number");
    expect(typeof doc.lng).toBe("number");
    expect(typeof doc.rating).toBe("number");
    expect(doc.is_verified).toBe(true);
    expect(doc.type).toBe("restaurant");
    expect(doc.price_tier).toBe("fair");
    expect(doc.image_url).toBe("");
    // CLAUDE.md §3: this collection deliberately has NO updated_at.
    expect(doc.updated_at).toBeUndefined();
  });

  it("accepts all 11 documented type values and rejects anything else", async () => {
    const types = [
      "restaurant",
      "hotel",
      "transport",
      "hospital",
      "pharmacy",
      "police",
      "tourist_police",
      "atm_bank",
      "shopping",
      "attraction",
      "tourist_info",
    ];
    for (const type of types) {
      const result = await savePartnerLocation(
        partnerForm({ id: `zz_test_${type}`, type }),
        "create",
      );
      expect(result, type).toEqual({ ok: true });
    }
    expect(sizeOf("partner_locations")).toBe(types.length);

    for (const bad of ["cafe", "Restaurant", "", "tourist-police"]) {
      const result = await savePartnerLocation(
        partnerForm({ id: "zz_test_bad", type: bad }),
        "create",
      );
      expect(result.ok, bad).toBe(false);
    }
  });

  it("rejects out-of-range ratings and coordinates", async () => {
    for (const bad of [{ rating: "5.5" }, { rating: "-1" }, { lat: "91" }, { lng: "181" }]) {
      const result = await savePartnerLocation(
        partnerForm({ id: "zz_test_bad", ...bad }),
        "create",
      );
      expect(result.ok, JSON.stringify(bad)).toBe(false);
    }
    expect(sizeOf("partner_locations")).toBe(0);
  });

  it("stores a Firebase download URL — never a raw storage.googleapis.com URL", async () => {
    const form = partnerForm();
    form.set(
      "image",
      new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "image/jpeg" }),
    );

    expect(await savePartnerLocation(form, "create")).toEqual({ ok: true });

    expect(savedFiles).toHaveLength(1);
    expect(savedFiles[0]!.path).toMatch(
      /^partner_locations\/zz_test_partner\/[0-9a-f-]{36}\.jpg$/,
    );
    // Readability comes from a download token, not an ACL — the bucket has
    // uniform access and public-access prevention (CLAUDE.md §3).
    expect(savedFiles[0]!.token).toMatch(/^[0-9a-f-]{36}$/);

    const url = docIn("partner_locations", "zz_test_partner")!
      .image_url as string;
    expect(url.startsWith("https://firebasestorage.googleapis.com/")).toBe(true);
    expect(url).toContain("alt=media&token=");
    expect(url.startsWith("https://storage.googleapis.com/")).toBe(false);
  });

  it("rejects oversized and non-image uploads before touching Storage", async () => {
    const tooBig = partnerForm();
    tooBig.set(
      "image",
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.jpg", {
        type: "image/jpeg",
      }),
    );
    expect((await savePartnerLocation(tooBig, "create")).ok).toBe(false);

    const wrongType = partnerForm();
    wrongType.set(
      "image",
      new File([new Uint8Array([1])], "doc.pdf", { type: "application/pdf" }),
    );
    expect((await savePartnerLocation(wrongType, "create")).ok).toBe(false);

    expect(savedFiles).toHaveLength(0);
    expect(sizeOf("partner_locations")).toBe(0);
  });

  it("keeps the existing photo when an edit uploads no new file", async () => {
    await savePartnerLocation(
      partnerForm({ existing_image_url: "https://firebasestorage.googleapis.com/x?alt=media&token=t" }),
      "create",
    );
    await savePartnerLocation(
      partnerForm({
        name: "Renamed Cafe",
        existing_image_url:
          "https://firebasestorage.googleapis.com/x?alt=media&token=t",
      }),
      "edit",
      "zz_test_partner",
    );
    const doc = docIn("partner_locations", "zz_test_partner")!;
    expect(doc.name).toBe("Renamed Cafe");
    expect(doc.image_url).toBe(
      "https://firebasestorage.googleapis.com/x?alt=media&token=t",
    );
  });

  it("lists and deletes", async () => {
    await savePartnerLocation(partnerForm(), "create");
    expect((await listPartnerLocations()).map((p) => p.id)).toEqual([
      "zz_test_partner",
    ]);
    expect(await deletePartnerLocation("zz_test_partner")).toEqual({ ok: true });
    expect(sizeOf("partner_locations")).toBe(0);
  });

  it("fills `id` from the document ID so a seeded partner is editable (was F3)", async () => {
    // Regression guard for ../INTEGRATION_TEST.md §F3. 5 of the 6 live partner
    // documents carry no `id` field. getPartnerLocation used to return the raw
    // data, leaving `initial.id` undefined on a form whose ID input is disabled
    // during edit — so Zod rejected every save with "ID is required" and those
    // rows were permanently uneditable.
    docsOf("partner_locations")["legacy_seeded_partner"] = {
      name: "Seeded Partner",
      lat: 13.7563,
      lng: 100.5018,
      type: "restaurant",
      rating: 4.2,
      is_verified: true,
      price_tier: "fair",
      image_url: "",
    };

    expect((await getPartnerLocation("legacy_seeded_partner"))?.id).toBe(
      "legacy_seeded_partner",
    );
    expect((await listPartnerLocations()).map((p) => p.id)).toEqual([
      "legacy_seeded_partner",
    ]);

    // …and the round trip now saves instead of failing validation.
    const form = partnerForm({ id: "legacy_seeded_partner", name: "Renamed" });
    expect(
      await savePartnerLocation(form, "edit", "legacy_seeded_partner"),
    ).toEqual({ ok: true });
    expect(docIn("partner_locations", "legacy_seeded_partner")!.name).toBe(
      "Renamed",
    );
  });
});

// --- alert_zones ------------------------------------------------------------

const EARTH_RADIUS_KM = 6371;
const toRad = (d: number) => (d * Math.PI) / 180;
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

describe("alert_zones CRUD", () => {
  it("writes polygon as GeoPoint[], not lat/lng maps", async () => {
    expect(await saveAlertZone(zoneInput(), "create")).toEqual({ ok: true });

    const doc = docIn("alert_zones", "zz_test_zone")!;
    const polygon = doc.polygon as unknown[];
    expect(polygon).toHaveLength(4);
    // AlertZone.fromFirestore filters with .whereType<GeoPoint>() — anything
    // else is dropped silently and the map overlay comes out empty.
    for (const point of polygon) expect(point).toBeInstanceOf(GeoPoint);
    expect((polygon[0] as GeoPoint).latitude).toBe(13.75);
    expect((polygon[0] as GeoPoint).longitude).toBe(100.5);
  });

  it("derives a centre and radius that contain the whole polygon", async () => {
    await saveAlertZone(zoneInput(), "create");
    const doc = docIn("alert_zones", "zz_test_zone")!;
    const center = { lat: doc.center_lat as number, lng: doc.center_lng as number };
    const radius = doc.radius_km as number;

    // geo_utils.isInsideZone uses center + radius_km as a bounding-circle
    // rejection BEFORE the precise polygon test. If any vertex falls outside
    // that circle, the Radar and the Home proximity card can reject a user
    // who is standing inside the zone. This invariant currently fails on the
    // live seeded zones — see ../INTEGRATION_TEST.md.
    for (const p of SQUARE) {
      expect(haversineKm(center, p)).toBeLessThanOrEqual(radius + 1e-9);
    }
    expect(center.lat).toBeCloseTo(13.755, 6);
    expect(center.lng).toBeCloseTo(100.505, 6);
  });

  it("recomputes the derived fields when the polygon changes", async () => {
    await saveAlertZone(zoneInput(), "create");
    const before = { ...docIn("alert_zones", "zz_test_zone")! };

    const bigger = SQUARE.map((p) => ({ lat: p.lat, lng: p.lng + 0.02 }));
    await saveAlertZone(
      zoneInput({ polygon: bigger }),
      "edit",
      "zz_test_zone",
    );
    const after = docIn("alert_zones", "zz_test_zone")!;
    expect(after.center_lng).not.toBe(before.center_lng);
    expect(after.radius_km as number).toBeGreaterThan(0);
  });

  it("rejects a polygon with fewer than 3 points", async () => {
    const result = await saveAlertZone(
      zoneInput({ polygon: SQUARE.slice(0, 2) }),
      "create",
    );
    expect(result.ok).toBe(false);
    expect(sizeOf("alert_zones")).toBe(0);
  });

  it("blocks non-compliant English wording before it reaches Firestore", async () => {
    for (const description_en of [
      "Scam area — avoid this shop.",
      "Dangerous zone for tourists.",
      "Merchants here overcharge tourists.",
    ]) {
      const result = await saveAlertZone(zoneInput({ description_en }), "create");
      expect(result.ok, description_en).toBe(false);
      expect(result.ok ? "" : result.error).toMatch(/wording/i);
    }
    expect(sizeOf("alert_zones")).toBe(0);
  });

  it("round-trips through getAlertZone and deletes", async () => {
    await saveAlertZone(zoneInput(), "create");
    const zone = await getAlertZone("zz_test_zone");
    expect(zone?.polygon).toEqual(SQUARE);
    expect(zone?.risk_level).toBe("caution");

    expect((await listAlertZones()).map((z) => z.id)).toEqual(["zz_test_zone"]);
    expect(await deleteAlertZone("zz_test_zone")).toEqual({ ok: true });
    expect(sizeOf("alert_zones")).toBe(0);
  });
});
