import { describe, expect, it } from "vitest";
import { ADMIN_MODULES, CONTENT_MODULES } from "./module-meta";

describe("the admin nav", () => {
  const byHref = (href: string) =>
    ADMIN_MODULES.find((m) => m.href === href);

  it("offers both public legal pages", () => {
    expect(byHref("/terms")).toBeDefined();
    expect(byHref("/privacy")).toBeDefined();
  });

  it.each(["/terms", "/privacy"])(
    "%s stays outside /admin, where a store reviewer can read it",
    (href) => {
      // 🚨 Auth is enforced in app/admin/layout.tsx, not middleware, so
      // anything under /admin needs a login. Apple and Google review the
      // subscription screen's links without an account: moving either page
      // under /admin turns the app's links into redirects and fails review.
      expect(href.startsWith("/admin")).toBe(false);
      expect(byHref(href)?.isExternal).toBe(true);
    },
  );

  it("keeps the legal pages off the dashboard's content cards", () => {
    // Those cards answer "what can I change from here". A read-only public
    // document sitting among three Firestore editors reads as a fourth thing
    // to fill in.
    const hrefs = CONTENT_MODULES.map((m) => m.href);
    expect(hrefs).not.toContain("/terms");
    expect(hrefs).not.toContain("/privacy");
  });

  it("still lists exactly the three content editors", () => {
    expect(CONTENT_MODULES.map((m) => m.href)).toEqual([
      "/admin/price-standards",
      "/admin/partner-locations",
      "/admin/alert-zones",
    ]);
  });

  it("gives every entry a label, a description and an icon", () => {
    // 🚨 Not `module` as the loop variable. Next's ESLint config forbids
    // binding that name anywhere under the project (it is the CommonJS
    // global), and `next build` treats it as an error — so a test file that
    // never ships broke the production build and, with it, the App Hosting
    // rollout. `tsc --noEmit` and vitest both passed; neither runs Next's lint.
    for (const entry of ADMIN_MODULES) {
      expect(entry.label.trim(), entry.href).not.toBe("");
      expect(entry.description.trim(), entry.href).not.toBe("");
      expect(entry.icon, entry.href).toBeDefined();
    }
  });
});
