import { notFound } from "next/navigation";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import { PageHeader } from "@/components/admin/page-header";
import { getAlertZone } from "@/lib/actions/alert-zones";
import { AlertZoneForm } from "../../alert-zone-form";

const TITLE = "Edit alert zone";

export default async function EditAlertZonePage({
  params,
}: {
  params: { id: string };
}) {
  let item;
  try {
    item = await getAlertZone(params.id);
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
      <AlertZoneForm mode="edit" initial={item} />
    </>
  );
}
