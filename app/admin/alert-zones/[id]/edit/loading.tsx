import { FormSkeleton } from "@/components/admin/form-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { EDIT_TITLE } from "../../meta";

/**
 * Shown while `page.tsx` awaits `getAlertZone(id)`. No description here — the
 * loaded page shows the zone's name, which is exactly what is not known yet.
 */
export default function EditAlertZoneLoading() {
  return (
    <>
      <PageHeader title={EDIT_TITLE} />
      <FormSkeleton
        groups={[{ fields: 4, columns: 2 }, { block: true }, { fields: 2 }]}
      />
    </>
  );
}
