import { notFound } from "next/navigation";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import { getPartnerLocation } from "@/lib/actions/partner-locations";
import { PartnerLocationForm } from "../../partner-location-form";

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
      <div>
        <h1 className="text-xl font-semibold">Edit Partner Location</h1>
        <div className="mt-4">
          <DataErrorNotice error={error} />
        </div>
      </div>
    );
  }

  if (!item) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold">Edit Partner Location</h1>
      <div className="mt-4">
        <PartnerLocationForm mode="edit" initial={item} />
      </div>
    </div>
  );
}
