import { FormSkeleton } from "@/components/admin/form-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { EDIT_TITLE } from "../../meta";

/** Shown while `page.tsx` awaits `getPriceStandard(id)`. */
export default function EditPriceStandardLoading() {
  return (
    <>
      <PageHeader title={EDIT_TITLE} />
      <FormSkeleton
        groups={[{ fields: 6, columns: 2 }, { fields: 4, columns: 2 }]}
      />
    </>
  );
}
