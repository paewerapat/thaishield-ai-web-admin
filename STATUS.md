# Build Status — ThaiShield AI Web Admin

Living checklist of what's built vs. what's blocked on real secrets/live
testing, per the plan in `WEB_ADMIN.md`. Update this file whenever an item
below moves from unverified to verified (or a new gap is found) — don't let
it go stale.

Last updated: 2026-08-16. 119 unit tests passing (`npm test`); `next build`,
`tsc --noEmit`, and `next lint` all clean with **no secrets configured**.

**The full test procedure now lives in `INTEGRATION_TEST.md` at the workspace
root** (`C:\Fastwork\thaishield-ai\`, the folder holding both repos) — it covers
both repos (this admin writes the documents that app reads), so it is kept in
one place rather than duplicated. Run it after every feature
change. F1–F4 (found 2026-08-14) are fixed as of 2026-08-16 and now have
regression tests in `lib/actions/crud-flow.test.ts` — the two `KNOWN ISSUE:`
tests were flipped. Two follow-ups need a human: re-save the five alert zones
through the CMS (F2 live data), and deploy `syncTravelAlerts` (F7).

## Built and working (no secrets needed)

- Next.js 14.2.35 app scaffold, Tailwind, TypeScript strict mode.
- Vitest unit testing setup.
- Firebase Admin SDK + client SDK wiring — lazy-initialized, so the app
  builds/runs with no `.env.local` at all; only throws (with a clear
  message) when a Firebase-touching function is actually called.
- **Credential resolution without a service account key** (`resolveCredential`
  in `lib/firebase/admin.ts`, unit tested). `FIREBASE_SERVICE_ACCOUNT_KEY` is
  now optional and falls back to Application Default Credentials. This was
  forced by the GCP org policy `constraints/iam.disableServiceAccountKeyCreation`
  — default-on for organizations created since mid-2024 — which makes the
  Firebase Console refuse to generate a key ("Key creation is not allowed on
  this service account"). ADC is the better path anyway: deployed on Cloud
  Functions/Cloud Run it resolves from the runtime service account with zero
  config, and locally it comes from `gcloud auth application-default login`.
  See `WEB_ADMIN.md` §10.2.
- `projectId` and `storageBucket` are now passed to `initializeApp` from the
  `NEXT_PUBLIC_FIREBASE_*` vars. Both are required on the ADC path — ADC
  carries no project id (Firestore would fail with "Unable to detect a Project
  Id"), and `getAdminStorage().bucket()` in `lib/actions/partner-locations.ts`
  takes no bucket name, so it needs the default configured here.
- Google Sign-In auth module (`lib/auth/`), domain-restriction logic
  (`assertAdminClaims`) fully unit tested.
- `/admin` route protection + redirect chain — verified against a local
  dev server: `/` → `/admin` → `/login` when unauthenticated, `/login`
  renders 200. This works with **zero** Firebase config because the
  no-cookie path never touches the Admin SDK.
- All three CRUD modules' **validation logic** (Zod schemas) — fully unit
  tested, including the legal-wording linter wired into `alert_zones`
  descriptions.
- `lib/geo/polygon.ts` centroid/bounding-radius math — fully unit tested.
- **`partner_locations.type` expanded 3 → 11 categories** (2026-08-11),
  landed together with the Flutter app's Phase 2A task 2.3. The values are
  `restaurant, hotel, transport, hospital, pharmacy, police, tourist_police,
  atm_bank, shopping, attraction, tourist_info` — mirrored from
  `PartnerCategory` in `lib/core/models/partner_category.dart` in the Flutter
  repo, and unit tested here. The three original values are unchanged, so no
  data migration was needed. The type `<select>` now renders
  `PARTNER_LOCATION_TYPE_LABELS` instead of the raw slugs. **Change the two
  lists together** — a value staff can enter but the app cannot render (or
  vice versa) is the failure mode this pairing exists to prevent.
- All pages/routes render and the full route tree builds successfully
  with no environment variables set.

## Built, but unverified — needs real secrets + live testing

These are implemented per spec but can only be exercised once Firebase
project credentials exist. None of this blocks continued development; it's
what to smoke-test first once secrets are in place.

1. ~~Whether Firebase's decoded ID token carries Google's `hd` claim.~~
   **RESOLVED 2026-08-08 — it does not.** Dumped a real decoded token from a
   `@thaishieldapp.com` Workspace sign-in: `hd` is absent entirely. Firebase
   forwards only its own claims (`firebase.identities`,
   `firebase.sign_in_provider`) plus the standard OIDC ones; provider-specific
   claims do not survive the exchange. `assertAdminClaims` now uses the
   documented fallback. See the residual-risk note below.
2. ~~Whether `thaishieldapp.com` is actually a Google Workspace domain.~~
   **RESOLVED 2026-08-08 — it is.** `MX → smtp.google.com` and
   `TXT → v=spf1 include:_spf.google.com ~all`. So #1's failure was Firebase's
   behaviour, not a non-Workspace domain.
3. Session cookie create/read/clear (`lib/auth/session.ts`) — **partially
   verified**: a real sign-in exercised `verifyIdToken` successfully (which
   also proves the ADC credential path works end to end against live Firebase).
   `createSessionCookie`/`verifySessionCookie` are still unexercised — the old
   `hd` check threw before reaching them.
4. Full Firestore CRUD against a live `price_standards` / `partner_locations`
   / `alert_zones` collection (list/create/update/delete). **Partially
   resolved 2026-08-14.** The Server Actions now run end to end against an
   in-memory Firestore in `lib/actions/crud-flow.test.ts` (21 tests: document
   shape, GeoPoint conversion, derived centre/radius, upload URL form, wording
   gate, all 11 `type` values), and a live `partner_locations` create is
   confirmed in production (`bp_samila_beach_hotel`, written 2026-08-09).
   Still unexercised live: `price_standards` and `alert_zones` writes, and the
   whole flow through the real UI. That pass turned up four defects — all four
   **fixed 2026-08-16**, see `../INTEGRATION_TEST.md` §F at the workspace root:
   - **F1 (critical)** `listPriceStandards()` ordered by `"id"`, a field none of
     the 61 seeded documents carry, so Firestore excluded every one of them and
     the screen rendered an empty table over live data. Now orders by
     `FieldPath.documentId()` and fills `id` from the document ID on read.
   - **F3** the same missing field left `initial.id` undefined on the partner
     edit form, so 5 of the 6 existing partner documents could not be saved.
     `partner-locations.ts` now has a `fromFirestore` like alert-zones.
   - **F4** `price_standards.image_url` (used by the Scanner result screen) is
     absent from the CMS input schema, and `.set()` replaces the document — so
     editing a dish deleted its reference photo. `updatePriceStandard()` now
     reads the stored value back and carries it forward. Staff still cannot set
     or clear that photo from the CMS; the image preview in §3 is still unbuilt.
   - **F2** the five seeded `alert_zones` carry a `radius_km` ~13% smaller than
     their own polygon's bounding radius, which can make `isInsideZone` reject a
     user standing in the zone. The CMS was always correct here — the Flutter
     repo's seed scripts were not, and are now. ⚠️ **The five live zone
     documents are still wrong**: open each one in the CMS and press Save so it
     recomputes the derived fields, then re-run `verify_data_contract.js`.
5. ~~Firebase Storage photo upload (`lib/actions/partner-locations.ts` →
   `uploadPartnerImage`).~~ **RESOLVED 2026-08-14 — the happy path works.**
   `partner_locations/bp_samila_beach_hotel` holds a real download URL written
   by this code on 2026-08-09, and fetching it anonymously returns HTTP 200,
   `image/jpeg`, 27,638 bytes. The bucket
   (`thaishield-ai-790eb.firebasestorage.app`) also verified to exist — it
   answers 403 while `…appspot.com` answers 404. Both earlier bugs (missing
   `storageBucket`, `makePublic()` under uniform bucket-level access) stay
   fixed; the download-token approach is confirmed in production.
   - The missing `storageBucket` app option is fixed (see above).
   - `makePublic()` is gone. It threw *"Cannot update access control for an
     object when uniform bucket-level access is enabled"* — UBLA is on by
     default for buckets Firebase creates now and disables per-object ACLs.
     Granting `allUsers` read on the bucket instead is also unavailable: this
     org's secure-by-default baseline enforces
     `storage.publicAccessPrevention`. Uploads now carry a Firebase download
     token, which needs neither.
   - **The project had no Storage bucket at all** — `gcloud storage buckets
     list` returned only the two `gcf-v2-*` buckets Cloud Functions created for
     `syncTravelAlerts`. Storage has to be enabled once in the Firebase Console
     (pick `asia-southeast1`, matching those buckets), then
     `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` checked against the name it creates.
6. **Google Maps polygon editor** (`components/admin/polygon-map-editor.tsx`)
   — first live browser session done, three faults found and fixed, but the
   editor still needs a **hands-on pass to confirm it now works**: draw a
   zone, drag a vertex, drag the shape, right-click a vertex, and check the
   point list below stays in step.
   - Adding a vertex to a **new** zone threw *"Cannot read properties of
     undefined (reading `__e3_`)"*. `new Polygon({ paths: pointList })` with
     an empty list yields a polygon with zero paths, so `getPath()` returns
     `undefined` — while `@types/google.maps` declares it as always returning
     `MVCArray<LatLng>`, which is why nothing caught it. Fixed by passing
     `paths: [pointList]`.
   - **Right-click to remove a vertex was never implemented**, though the
     helper text under the map has always advertised it.
   - React Strict Mode ran the init effect twice, stacking a second map and
     polygon on the same div and firing every `sync` twice. The effect now
     tears down its listeners and detaches the polygon.

   Earlier history: rebuilt once after `tsc` caught the original use of
   `DrawingManager`, which Google removed from the Maps JS API around June
   2026 (v3.65+). The manual point-list editor beside it has no Maps
   dependency and keeps the alert_zones flow usable regardless.
7. Deployment to Firebase Hosting (`WEB_ADMIN.md` §10) — steps are
   documented but nothing has been deployed yet.

## Local dev gotcha: ADC expires roughly daily

Symptom — Server Actions start failing with:

> Credential implementation provided to initializeApp() … failed to fetch a
> valid Google OAuth2 access token … `"error_subtype":"invalid_rapt"`

**Ignore both causes that error suggests.** It blames clock skew or a revoked
service account key file; neither applies, because this project authenticates
with user ADC (`type: authorized_user`) and has no key file at all — see the
org-policy note above.

`rapt` is Google's ReAuth Proof Token. The `thaishieldapp.com` Workspace enforces
a Google Cloud session length (16 hours by default), after which the stored
refresh token can no longer mint access tokens. Fix:

```bash
gcloud auth application-default login
```

then **restart the dev server** — `lib/firebase/admin.ts` caches the initialized
app at module scope and `applicationDefault()` caches the credential internally,
so a running process keeps using the dead one.

This does not affect deployments: Cloud Run runs as a service account, which no
reauth policy applies to. A Workspace admin can extend the session under
Security → Google Cloud session control, at the cost of weakening it org-wide.

## Known security debt

**Admin access is gated on an email suffix, not on Workspace membership.**
Consequence of item #1 above: with `hd` unavailable there is no claim that
distinguishes a real `@thaishieldapp.com` Workspace account from a consumer
Google account bearing the same address. Google blocks consumer signup on a
domain an active Workspace tenant has claimed, so the practical exposure is
narrow — chiefly "conflicting accounts" created before the domain joined
Workspace. Anyone in that position who signs in gets full admin.

Proper fix, worth doing before this handles anything sensitive: mint a custom
claim (e.g. `admin: true`) with the Admin SDK for each named staff member and
gate on **that** instead of the email domain. It is a small change to
`assertAdminClaims` plus a one-off provisioning script, and it makes admin
access an explicit allowlist rather than an inference from an address. The
Workspace admin can also resolve existing conflicting accounts from the
Google Admin console as a stopgap.

## Known dependency vulnerabilities (tracked, not silently ignored)

`npm audit` currently reports 11 advisories (6 moderate, 5 high). Do **not**
run `npm audit fix --force` without discussion — it downgrades `next` to
16.x (reverses the explicit decision to pin Next 14) and `firebase-admin`
to 10.3.0 (much older, likely missing APIs this project uses).

- **Next.js core (5 high)**: `next@14.2.35` is already the newest 14.x
  patch available — there is no smaller fix. The advisories (DoS, SSRF,
  cache poisoning, XSS variants) mostly require specific features this
  admin doesn't currently use (custom servers, i18n rewrites, Image
  Optimizer with attacker-controlled `remotePatterns`, WebSocket
  upgrades). Re-evaluate the Next.js major version before production launch.
- **`firebase-admin` → `@google-cloud/storage` → `teeny-request`/
  `retry-request` → `uuid` (6 moderate)**: an unpatched-upstream issue —
  even the latest standalone `@google-cloud/storage@7.21.0` still pulls
  the same vulnerable `uuid` range. Nothing to do here until Google patches
  it; not something a version choice on our side can fix right now.

## Not started / deferred

- GitHub Actions CI/CD for preview/production deploys (`WEB_ADMIN.md`
  §10.5) — optional, not required for the first manual deploy.
- The line-item 1.5 legal-wording **QA pass** itself (human review of all
  seeded/entered copy) — the automated linter (task 8) is a supplement to
  this, not a replacement, especially since it only recognizes
  English-language terms and can't catch Thai-language accusatory wording.

## Next steps once secrets are added

1. Fill in `.env.local` from `.env.example`. Leave
   `FIREBASE_SERVICE_ACCOUNT_KEY` blank and run
   `gcloud auth application-default login` instead (install the gcloud CLI
   first: https://cloud.google.com/sdk/docs/install). Only
   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` still has to be obtained by hand.
2. Confirm the Firebase project is on the Blaze plan (`WEB_ADMIN.md` §10.1).
3. `npm run dev`, sign in with a real `@thaishieldapp.com` account, and
   verify the domain check actually rejects a personal Google account
   (item #1/#2 above) before trusting it in production.
4. Smoke-test each CRUD module end-to-end against real Firestore/Storage.
5. Test the Google Maps polygon editor in a real browser; if `hd` turned
   out to be unavailable (item #1), switch `assertAdminClaims` to the
   documented fallback before going further.
