import { notFound } from "next/navigation";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import { PageHeader } from "@/components/admin/page-header";
import { getPartnerLocation } from "@/lib/actions/partner-locations";
import { PartnerLocationForm } from "../../partner-location-form";

const TITLE = "Edit partner";

export default async function EditPartnerLocationPage({
  params,
}: {
  params: { id: string };
}) {
  let item;
  try {
    item = await getPartnerLocation(params.id);
  } catch (error) {
    return (
      <>
        <PageHeader title={TITLE} />
        <DataErrorNotice error={error} />
      </>
    );
  }

  if (!item) notFound();

  return (
    <>
      <PageHeader title={TITLE} description={item.name} />
      <PartnerLocationForm mode="edit" initial={item} />
    </>
  );
}
