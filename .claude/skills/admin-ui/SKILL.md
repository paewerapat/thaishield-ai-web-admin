---
name: admin-ui
description: Design system for the ThaiShield AI Web Admin — the shadcn/ui setup, the ThaiShield brand palette, and the layout/table/form patterns every admin screen follows. Load this before building or restyling any page, component, or form under app/admin/, app/login/, or components/admin/, and before adding a shadcn component or touching globals.css / tailwind.config.ts.
---

# ThaiShield Admin UI

Internal CMS for staff who edit Firestore content the Flutter app reads. Optimize
for **scanning and editing dense data quickly**, not for marketing polish. Every
screen is a table or a form.

## Stack

**shadcn/ui** — components are copied into `components/ui/`, not installed as a
dependency. Edit them freely; they are our source now.

```bash
# Adding a component. The version pin is REQUIRED.
npx shadcn@2.3.0 add <component>
```

⚠️ **Always pin `shadcn@2.3.0`.** This project is Tailwind **3.4** + React **18** +
Next **14**. `shadcn@latest` (4.x) emits Tailwind v4 syntax and will try to migrate
the project. Per the official docs: *"If you are using Tailwind v3, use
`shadcn@2.3.0`."*

⚠️ **Never let the CLI own `app/globals.css` or `tailwind.config.ts`.** Even at
2.3.0, `init` pulls colour values from the live registry and writes them as
`oklch(...)`, while the config it generates wraps each one as `hsl(var(--token))`.
The result is `hsl(oklch(...))` — invalid CSS that silently drops *every* colour
in the app. Both files are hand-maintained here. After any `init`/`add`, check
`git diff` on them and revert; the only thing worth keeping from a fresh run is
new files under `components/ui/`.

The same run also emitted `destructive` with no `.foreground` key while
`button.tsx` referenced `text-destructive-foreground`. Treat generated config as
a draft, not as truth — grep new components for colour classes and confirm each
one exists in the config.

## Palette

Follows `CLAUDE.md` §8 so the admin reads as the same product as the Flutter app.
Defined as CSS variables in `app/globals.css`, exposed as Tailwind colors in
`tailwind.config.ts`. **Use the semantic token, never a raw hex, in components.**

| Token | Hex | Use for |
|---|---|---|
| `brand` | `#0A1810` | Sidebar and page header background. Nothing else. |
| `brand-foreground` | `#F3F5F7` | Text on `brand`. |
| `gold` | `#FFB300` | Active nav item, brand wordmark, primary emphasis. Sparingly. |
| `ink` | `#0D1B2A` | Headings and body text on white cards. |
| `muted-foreground` | `#90A4AE` | Secondary text, table headers, hints. |
| `canvas` | `#F3F5F7` | Page background behind cards. |
| `success` | `#2E7D32` | Verified badges, "fair" price tier, safe zones. |
| `warning` | `#FFB300` | "caution" tier/zone. Same gold, different meaning. |
| `danger` | `#D32F2F` | Destructive actions, "danger" zones. |
| `info` | `#4FC3F7` | Informational accents. |

Two dark colors with strictly separate jobs — do not mix them:
`brand` `#0A1810` is **only** a chrome background; `ink` `#0D1B2A` is **only**
text on light surfaces. The Flutter app regressed on exactly this once.

**Light mode only.** No dark-mode variants — the sidebar is already dark and a
second theme doubles the surface area for no user benefit here. Do not add
`prefers-color-scheme` blocks or `dark:` variants.

## Layout

```
┌────────────┬──────────────────────────────────┐
│  sidebar   │  page header (title + action)    │
│  bg-brand  ├──────────────────────────────────┤
│  w-60      │  bg-canvas, p-6                  │
│  fixed     │    └─ Card > Table | form        │
└────────────┴──────────────────────────────────┘
```

- `app/admin/layout.tsx` owns the sidebar and renders the session email +
  sign-out at its bottom. It is a Server Component and must stay one — it calls
  `getAdminSession()`. Only the nav-link highlight needs `"use client"`.
- Every page starts with `<PageHeader title=… action=… />`, then content.
- Content sits in a `Card`. Tables go edge-to-edge inside it (no card padding
  around the table itself) so rows align with the card border.

## Patterns

**List pages** — `Card` > `Table`. Right-align the actions column. Always render
an empty state (`TableEmpty`) rather than a bare `<tbody>`; a blank table looks
like a loading bug. Destructive actions use a confirm dialog, never a bare
submit button.

**Forms** — one `<Card>` per logical group, `Label` above every `Input`. The
six multi-language name fields (`name_en/th/zh/ko/ru/ja`) go in a 2-column grid
under one "Names" card, never as six stacked full-width inputs. Show Zod field
errors inline under the input, in `text-danger`.

**Server Components by default.** Add `"use client"` only for genuine
interactivity (the map editor, the polygon point list, confirm dialogs, nav
highlighting). Forms submit via Server Actions with plain `<form action={…}>`.

## Copy rules

All user-facing text — including anything staff type into free-text fields —
must follow `CLAUDE.md` §7's legal-wording table. Never "Scam", "Fraud",
"Dangerous", "Overcharge"; use "Travel Alert", "Above Typical Range", etc.
`lib/legal-wording.ts` lints `alert_zones` descriptions; it only catches
English, so Thai copy still needs human review.

Any screen showing price analysis must carry the §7 disclaimer verbatim.

## Checks

`npx tsc --noEmit && npx next lint && npm test && npx next build` — all four
must pass. `next build` is the one that catches a Server/Client Component
boundary mistake; the others will not.
