import { notFound } from "next/navigation";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import { getAlertZone } from "@/lib/actions/alert-zones";
import { AlertZoneForm } from "../../alert-zone-form";

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
      <div>
        <h1 className="text-xl font-semibold">Edit Alert Zone</h1>
        <div className="mt-4">
          <DataErrorNotice error={error} />
        </div>
      </div>
    );
  }

  if (!item) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold">Edit Alert Zone</h1>
      <div className="mt-4">
        <AlertZoneForm mode="edit" initial={item} />
      </div>
    </div>
  );
}
