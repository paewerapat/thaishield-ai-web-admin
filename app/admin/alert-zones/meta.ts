/**
 * Page title and description, shared by `page.tsx` and its `loading.tsx` so
 * the skeleton shows the same header the loaded page will — no swap, no
 * reflow. Kept out of `page.tsx` because Next validates the named exports of a
 * page file and rejects arbitrary ones.
 */
export const TITLE = "Alert Zones";
export const DESCRIPTION =
  "Travel-advisory area boundaries drawn on the app's Smart Map.";
export const EDIT_TITLE = "Edit alert zone";
