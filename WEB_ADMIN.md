# ThaiShield AI — Web Admin (CMS) Blueprint & Developer Rules

You are an expert Next.js & Firebase developer helper. This document is the spec for the
**Web Admin dashboard** — a separate project/repo from the ThaiShield AI Flutter app, quoted
as its own engagement (see `Requirement.html`, Phase 1 line items 1.1–1.5, total **9,000 THB**).
The Flutter app's own rules and data model live in `CLAUDE.md` in this same folder — **read
that file first**, since this admin exists only to manage the Firestore collections the app
already reads from. Follow both documents; where they overlap (Firestore schema, legal
wording, security rules), `CLAUDE.md` is the source of truth and this file must stay
consistent with it. See `STATUS.md` for what's actually built vs. still pending real
secrets/live testing — check it before assuming something described here already works
end-to-end.

## 0. What this project is (and isn't)

- A non-technical-staff-facing **web admin / CMS** for managing three Firestore collections
  used by the ThaiShield AI Flutter app: `price_standards`, `partner_locations`,
  `alert_zones`. Today these are edited by hand in the Firebase Console — this project
  replaces that with proper CRUD screens.
- **Not** a new product with its own end-user features. It writes to the *same* collections
  the Flutter app already reads via `FirestoreService` — the Flutter app needs **zero code
  changes** to consume data this admin writes, as long as field names/types match the schema
  in Section 3 below exactly.
- **Not** the "Smart Map Premium V2" work in `Requirement.html` Phase 2 (Safety Radar, Route
  Suggestion, IAP paywall, etc.) — that is Flutter app work, a separate 23,000 THB engagement,
  and out of scope for this repo.

## 1. Environment & Architecture

- **Framework:** Next.js 14 (App Router), deployed to **Firebase Hosting**.
- **Backend access:** **Firebase Admin SDK** with a service account, used from Next.js
  Server Actions / Route Handlers. The Admin SDK bypasses Firestore security rules by
  design — this is the intended approach so the public app rules (`CLAUDE.md` Section 6:
  `allow read: if true; allow write: if false;`) never need to be weakened. **Never** add a
  client-side Firestore write path or loosen the public rules to make the admin work.
- **Auth:** Firebase Authentication, admin-only login screen. This is a property of *this*
  project only — it does not contradict the Flutter app having no auth (`CLAUDE.md` Section
  3); the app and the admin are different Firebase Auth surfaces entirely.
- **Storage:** Firebase Storage for real partner photos (replaces the Flutter app's current
  Pexels stock-photo placeholders in `partner_locations.image_url`).
- **Maps:** Google Maps JavaScript API for the `alert_zones` polygon editor.
- **Local dev OS:** Windows. No platform-specific constraints beyond normal Node/Next.js
  tooling (unlike the Flutter app, there's no iOS/Android split to worry about here).

## 2. Scope & Budget

Per `Requirement.html` §Phase 1 (9,000 THB total, 5 line items):

| # | Item | Price (THB) |
|---|---|---|
| 1.1 | Project setup + Admin Auth (Next.js 14, Firebase Admin SDK & Admin Auth) | 1,500 |
| 1.2 | `price_standards` CRUD — multi-language fields, image preview | 2,000 |
| 1.3 | `partner_locations` CRUD — real photo upload to Firebase Storage | 2,000 |
| 1.4 | `alert_zones` CRUD with **interactive polygon editor** (Google Maps API) | 2,500 |
| 1.5 | System testing, legal-wording compliance QA, deploy to Firebase Hosting | 1,000 |
| | **Total** | **9,000** |

Payment terms (Phase 1 portion only — combined invoice also includes Phase 2 Flutter work,
not itemized here):
- งวดที่ 1 (30%) — 2,700 THB — project kickoff + Web Admin setup
- งวดที่ 2 (40%) — 3,600 THB — data-management + map-editor screens complete
- งวดที่ 3 (30%) — 2,700 THB — verification, legal QA, deploy

## 3. Firestore Schema (must match exactly — copied from `CLAUDE.md`)

This admin does not own the schema; it must read/write the **same shapes** the Flutter app
expects. Do not add/rename/remove fields without also updating `CLAUDE.md` and the Flutter
app's `FirestoreService`.

### `price_standards`
```
{
  id:         string,          // e.g. "pad_thai"
  name_en:    string,
  name_th:    string,
  name_zh:    string,
  name_ko:    string,
  name_ru:    string,
  name_ja:    string,
  min_price:  number,          // THB
  max_price:  number,          // THB
  category:   string,          // "food" | "transport" | "attraction"
  updated_at: timestamp
}
```
Admin screen: table + form CRUD, one input per language field, live min/max validation
(`max_price >= min_price`), image preview if/when a reference image is added, `updated_at`
set server-side on every write (never trust a client-supplied timestamp).

### `partner_locations`
```
{
  id:           string,
  name:         string,
  lat:          number,
  lng:          number,
  type:         string,        // "restaurant" | "hotel" | "transport"
  rating:       number,        // 0.0 - 5.0
  is_verified:  boolean,
  price_tier:   string,        // "fair" | "caution" | "high"
  image_url:    string
}
```
Admin screen: CRUD with a **real photo upload** to Firebase Storage (not a hotlinked URL
field) — on upload, store the resulting Storage download URL into `image_url`. A map picker
(or manual lat/lng input) sets `lat`/`lng`. Note the Flutter app's Phase 2 roadmap expands
`type` from 3 → 11 categories; if that Flutter work ships before/during this admin build,
mirror the same enum here rather than hardcoding just 3 values in a `<select>`.

### `alert_zones`
```
{
  id:             string,
  name:           string,
  center_lat:     number,
  center_lng:     number,
  radius_km:      number,
  polygon:        array<GeoPoint>,  // area boundary points for map overlay
  risk_level:     string,      // "safe" | "caution" | "danger"
  description_en: string,
  description_th: string
}
```
Admin screen: this is the highest-effort item (2,500 THB) — an **interactive polygon editor**
built on the Google Maps JavaScript API (`google.maps.drawing.DrawingManager` or manual
vertex editing) that lets staff draw/edit the boundary directly on a map instead of hand-
editing GeoPoint arrays in the Firebase Console. On save, compute/store `center_lat`/
`center_lng` (e.g. polygon centroid) alongside the raw `polygon` point array. Free-text
`description_en`/`description_th` fields **must** go through the legal-wording check in
Section 5 before save (see 1.5 / QA below).

### `travel_alerts_cache` — do not build CRUD for this
Written only by the Flutter app's `syncTravelAlerts` Cloud Function via the Admin SDK. Not
in the Phase 1 quotation scope; leave it out of the admin UI entirely.

## 4. Auth & Firestore Access Strategy

- **Login: Google Sign-In only** (Firebase Auth `GoogleAuthProvider`) — no email/password,
  no other providers. Staff sign in with their company Google account; no separate
  credentials for this app to leak, reset, or brute-force.
- **Authorization: restrict to the `@thaishieldapp.com` domain**, verified **server-side only
  and via the `hd` (hosted domain) claim, not a raw string match on `email`.** After sign-in,
  send the Firebase ID token to a Server Action / Route Handler, verify it with
  `admin.auth().verifyIdToken(idToken)`, and check the **decoded token's** `hd` claim equals
  `thaishieldapp.com`. Reject (and sign out) anything else — including a `@thaishieldapp.com`
  email with no `hd` claim, since that indicates a consumer Google account merely *using*
  that address rather than a real Google Workspace–managed account for the domain. Never
  trust an `email`/`hd` value read from the client request body — only the value inside the
  cryptographically verified token.
- Pass `hd: "thaishieldapp.com"` as a custom OAuth parameter on the Google provider at
  sign-in time (`GoogleAuthProvider.setCustomParameters({ hd: "thaishieldapp.com" })`) to
  pre-filter the account chooser — this is a **UX nicety only**, not a security control; the
  server-side `hd` claim check above is what actually enforces the restriction and must never
  be skipped.
- **Re-verify on every Server Action**, not just at login — gate each one behind a check that
  the calling session's token is valid, unexpired, and still carries `hd:
  thaishieldapp.com`. Don't rely on UI-only route protection (e.g. a client-side redirect on
  an unauthenticated dashboard route is not a security boundary by itself).
- All Firestore reads/writes from this app go through **Server Actions / API routes using
  the Firebase Admin SDK + service account**, never the client SDK — keeps the service
  account key server-side only and keeps the public Firestore rules untouched.
- The service account key is a secret: store it in environment variables / Firebase Hosting
  secret config, never commit it to the repo.
- **Recommended hardening (raise with the user before deciding, not required for MVP):**
  - An explicit allowlist of admin emails/UIDs (Firestore doc or custom claims) as
    defense-in-depth on top of the domain check — closes the gap where domain-only trust
    means *any* current Workspace user gets admin access, which is only as safe as the
    org's own Workspace user offboarding process.
  - Enforce 2-Step Verification at the Google Workspace admin-console level for the
    `thaishieldapp.com` domain — outside this app's code, but the highest-leverage control
    against credential compromise.

## 5. Legal Wording Compliance (MANDATORY — copied rule from `CLAUDE.md` §7)

Any free-text field editable through this admin — chiefly `alert_zones.description_en` /
`description_th`, and `price_standards`/`partner_locations` name fields — is a route for
non-technical staff to accidentally introduce accusatory or defamatory wording that bypasses
the Flutter app's own vetted copy. Per `CLAUDE.md` Section 7:

- Never allow/ship copy using: Scam, Scammer, Fraud, Overcharge, Rip-off, Cheating,
  Dangerous, Unsafe, Blacklist, Exploitation, or similar accusatory terms — use the neutral
  replacements in `CLAUDE.md`'s wording table instead (e.g. "Travel Advisory Area" not
  "Dangerous Zone", "Higher Than Average" not "Overcharge").
- Never let an admin-entered field put a specific shop name, brand, or exact accusation into
  anything the price-scan/map UI would surface as judgmental — statistical/informational
  framing only.
- Line item **1.5** in the quotation is explicitly a QA pass for this: before go-live, review
  all seeded/entered copy against the wording table. Consider adding a lightweight linter/
  keyword-blocklist check on the free-text form fields (client + server-side) that flags the
  "Avoid" column terms before save, as a standing guardrail beyond the one-time QA pass.

## 6. Out of Scope (do not build)

- Anything from `Requirement.html` Phase 2 (Safety Radar, Route Suggestion, IAP/paywall) —
  that's Flutter app work, separately quoted, different repo.
- End-user-facing features of any kind — this is an internal staff tool only.
- CRUD for `travel_alerts_cache` (Section 3 above).
- Changes to the Flutter app's Firestore **read** rules — stay read-only/public for the app;
  this admin's writes go through the Admin SDK, which is unaffected by those rules.
- New Firestore collections beyond the three listed — if the business needs more managed
  data, that's a scope change to raise explicitly, not something to add silently.

## 7. Timeline (from `Requirement.html`)

| # | Task | Dates | Status |
|---|---|---|---|
| 1 | Setup Environment & Firebase Admin SDK / Auth | 2 days (2026-07-20 – 2026-07-22) | รอดำเนินการ |
| 2 | UI & Server Actions for `price_standards` CRUD | 2 days (2026-07-23 – 2026-07-27) | รอดำเนินการ |
| 3 | UI for `partner_locations` + real image upload | 3 days (2026-07-28 – 2026-07-30) | รอดำเนินการ |
| 4 | Polygon-drawing tool for `alert_zones` (Google Maps API) | 4 days (2026-07-31 – 2026-08-05) | รอดำเนินการ |
| 5 | Overall QA, legal-wording check, deploy to production | 1 day (2026-08-06 – 2026-08-07) | รอดำเนินการ |

Note: today is **2026-08-02**, which falls inside task 4's window (`alert_zones` polygon
editor) — if work hasn't started yet, that task is the one at risk of slipping and pushing
the 2026-08-06/07 QA + deploy dates.

## 8. Suggested Build Order

1. **1.1 Setup** — `create-next-app` (App Router), Firebase project wiring (Admin SDK service
   account, Firebase Auth), a protected `/admin` layout with login.
2. **1.2 `price_standards`** — simplest schema, good first CRUD screen to establish the
   table/form/Server Action pattern reused by the other two.
3. **1.3 `partner_locations`** — adds Firebase Storage upload flow on top of the same CRUD
   pattern.
4. **1.4 `alert_zones`** — highest complexity, the Google Maps polygon editor; build last so
   the CRUD scaffolding is already proven.
5. **1.5 QA & deploy** — legal-wording pass across all entered/seed copy (Section 5), smoke
   test all three CRUD flows end-to-end against the Flutter app (confirm the app still reads
   correctly after admin-driven writes), `firebase deploy --only hosting`.

## 9. UI Theme

No mockup is specified for the admin in `Requirement.html`. The Flutter app's dark-green
"ranger" theme (`CLAUDE.md` Section 8, `#0A1810` header / `#F3F5F7` body / `#FFB300` gold
accent) is **not** a requirement for this internal tool, but reusing it is a reasonable
default for brand consistency unless/until the user specifies a different admin-specific
design — confirm before investing significant UI polish effort either way.

## 10. Deployment (Firebase Hosting)

`Requirement.html` line 1.5 and this doc's §1 both commit to **Firebase Hosting** as the
deploy target — that's correct, but note **plain static Firebase Hosting is not enough on
its own**: §4's Server Actions (Firestore writes via the Admin SDK, ID-token verification)
require a server runtime, not a static export. Deploy via **Firebase Hosting's Next.js web
framework support**, which packages the SSR/Server Action backend as a Cloud Function/Cloud
Run service behind Hosting's CDN automatically — `firebase deploy --only hosting` still
works as documented, just make sure the framework-aware setup below is used instead of
`next export`.

### 10.1 One-time project setup

1. **Confirm the target Firebase project is on the Blaze (pay-as-you-go) plan.** Same
   requirement as the Flutter app's Cloud Functions (`CLAUDE.md` §2b/§4) — the SSR backend
   runs as a Cloud Function/Cloud Run service under the hood, which cannot deploy on the
   free Spark plan. Check at
   `https://console.firebase.google.com/project/<project-id>/usage`.
2. **Decide which Firebase project this admin lives in.** It almost certainly must be the
   **same project** as the Flutter app (`thaishield-ai-790eb` per `CLAUDE.md`), since it
   writes to the exact Firestore instance the app reads from — don't create a separate
   project for this admin.
3. Install/update the Firebase CLI and log in (once per machine):
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
4. **(Recommended) create a dedicated Hosting site** for the admin rather than reusing the
   project's default Hosting site, so it gets its own URL/subdomain and doesn't collide with
   anything else deployed to the same project later:
   ```bash
   firebase hosting:sites:create thaishield-admin
   ```
5. From the Next.js project root, run:
   ```bash
   firebase init hosting
   ```
   - Select the existing project (`thaishield-ai-790eb`).
   - When asked *"What do you want to use as your public directory?"* / *"Do you want to
     use a web framework?"* — **answer yes to the web framework prompt**; the CLI
     auto-detects Next.js and configures `firebase.json` + `apphosting`/`.firebase/` output
     config to build and serve it with SSR support. Do not manually set the public
     directory to a static `next export` folder.
   - If prompted for the Hosting site, pick the `thaishield-admin` site created in step 4.

### 10.2 Secrets & environment variables

Never commit the service account key or API keys (already enforced by `.gitignore`). The
SSR backend runs as a Cloud Function, so runtime secrets are injected the same way as the
Flutter app's `syncTravelAlerts` function (`CLAUDE.md` §2b/§4):
```bash
firebase functions:secrets:set FIREBASE_SERVICE_ACCOUNT_KEY
firebase functions:secrets:set GOOGLE_MAPS_API_KEY
```
Reference these as environment variables in the Next.js server code (`process.env.…`) —
never `NEXT_PUBLIC_`-prefixed, since that would bundle them into client-side JS.

### 10.3 Deploy

```bash
# from the Next.js project root
npm run build      # sanity-check the build locally first
firebase deploy --only hosting
```
This builds the app and deploys both the static assets and the SSR backend function in one
step. Firebase prints the live Hosting URL (e.g. `https://thaishield-admin.web.app`) when
it finishes.

### 10.4 Verify after every deploy

- Sign in with a `@thaishieldapp.com` Google account on the **live** URL and confirm the
  `hd`-claim check (§4) actually rejects a non-domain account — test this in an incognito
  window with a personal Google account.
- Exercise all three CRUD screens once against the live site, then confirm the Flutter app
  still reads the changes correctly (per §8 step 5's QA pass).
- Check the Firebase Console **Functions** tab for the new SSR backend function's logs if
  anything 500s — Server Action errors surface there, not in `firebase deploy` output.

### 10.5 Optional: CI/CD via GitHub Actions

Once the GitHub repo is pushed, `firebase init hosting:github` can wire up automatic
**preview channel deploys on every PR** and **production deploy on merge to `main`** using
the `FirebaseExtended/action-hosting-deploy` GitHub Action — worth setting up once the repo
exists on GitHub, so line-item 1.5's "deploy to production" isn't a manual step going
forward. Not required for the first deploy; can be added later without changing anything
above.
