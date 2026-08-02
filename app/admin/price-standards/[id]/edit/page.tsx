import { notFound } from "next/navigation";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import { getPriceStandard } from "@/lib/actions/price-standards";
import { PriceStandardForm } from "../../price-standard-form";

export default async function EditPriceStandardPage({
  params,
}: {
  params: { id: string };
}) {
  let item;
  try {
    item = await getPriceStandard(params.id);
  } catch (error) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Edit Price Standard</h1>
        <div className="mt-4">
          <DataErrorNotice error={error} />
        </div>
      </div>
    );
  }

  if (!item) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold">Edit Price Standard</h1>
      <div className="mt-4">
        <PriceStandardForm mode="edit" initial={item} />
      </div>
    </div>
  );
}
