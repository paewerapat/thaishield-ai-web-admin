import { FormSkeleton } from "@/components/admin/form-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { EDIT_TITLE } from "../../meta";

/** Shown while `page.tsx` awaits `getPartnerLocation(id)`. */
export default function EditPartnerLocationLoading() {
  return (
    <>
      <PageHeader title={EDIT_TITLE} />
      <FormSkeleton
        groups={[{ fields: 4, columns: 2 }, { block: true }, { fields: 3, columns: 2 }]}
      />
    </>
  );
}
