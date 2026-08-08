import { notFound } from "next/navigation";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import { PageHeader } from "@/components/admin/page-header";
import { getPriceStandard } from "@/lib/actions/price-standards";
import { PriceStandardForm } from "../../price-standard-form";

const TITLE = "Edit price standard";

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
      <>
        <PageHeader title={TITLE} />
        <DataErrorNotice error={error} />
      </>
    );
  }

  if (!item) notFound();

  return (
    <>
      <PageHeader title={TITLE} description={item.name_en} />
      <PriceStandardForm mode="edit" initial={item} />
    </>
  );
}
