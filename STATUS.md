# Build Status — ThaiShield AI Web Admin

Living checklist of what's built vs. what's blocked on real secrets/live
testing, per the plan in `WEB_ADMIN.md`. Update this file whenever an item
below moves from unverified to verified (or a new gap is found) — don't let
it go stale.

Last updated: 2026-08-08. 76 unit tests passing (`npm test`); `next build`,
`tsc --noEmit`, and `next lint` all clean with **no secrets configured**.

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
- All pages/routes render and the full route tree builds successfully
  with no environment variables set.

## Built, but unverified — needs real secrets + live testing

These are implemented per spec but can only be exercised once Firebase
project credentials exist. None of this blocks continued development; it's
what to smoke-test first once secrets are in place.

1. **Whether Firebase's decoded ID token actually carries Google's `hd`
   claim.** The whole domain-restriction design (`WEB_ADMIN.md` §4) hinges
   on this. Flagged in detail in `lib/auth/admin-claims.ts`'s doc comment,
   with a documented fallback (check `email_verified` + `firebase.sign_in_provider
   === "google.com"` + email domain string) if `hd` turns out to be absent.
   **First thing to test** once a real `@thaishieldapp.com` Google
   Workspace sign-in is possible.
2. **Whether `thaishieldapp.com` is actually a Google Workspace domain.**
   If it isn't, no `@thaishieldapp.com` Google account will have an `hd`
   claim at all (or exist via Google Sign-In in the expected way) —
   confirm this before assuming #1's design works as intended.
3. Session cookie create/read/clear (`lib/auth/session.ts`) — needs a real
   sign-in to exercise `verifyIdToken`/`createSessionCookie`/
   `verifySessionCookie`.
4. Full Firestore CRUD against a live `price_standards` / `partner_locations`
   / `alert_zones` collection (list/create/update/delete) — the Server
   Actions are written and the validation in front of them is tested, but
   the actual Admin SDK calls are unexercised.
5. Firebase Storage photo upload (`lib/actions/partner-locations.ts` →
   `uploadPartnerImage`) — needs a real Storage bucket. The missing
   `storageBucket` app option that would have made this fail outright is now
   fixed (see above), but the upload path itself is still unexercised.
6. **Google Maps polygon editor** (`components/admin/polygon-map-editor.tsx`)
   — needs a live browser session with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   set. This was already rebuilt once after `tsc` caught that the
   originally-written code used `DrawingManager`, which Google removed
   from the Maps JS API around June 2026 (v3.65+) — the current
   implementation (click-to-add-vertex on a plain editable `Polygon`)
   compiles against the installed `@types/google.maps` but has not been
   exercised in a real browser. The manual point-list editor next to it
   has no such dependency and is what makes the alert_zones flow usable
   right now regardless.
7. Deployment to Firebase Hosting (`WEB_ADMIN.md` §10) — steps are
   documented but nothing has been deployed yet.

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

- `partner_locations.type` enum expansion (3 → 11 categories) — the
  Flutter app's own Phase 2 work for this hasn't shipped yet and the
  actual 11 values aren't specified anywhere, so `lib/schemas/partner-locations.ts`
  intentionally mirrors CLAUDE.md's current 3-value enum. Update it (and
  its tests) the moment that Flutter-side schema change ships.
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
