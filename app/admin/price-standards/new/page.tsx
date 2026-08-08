import { PageHeader } from "@/components/admin/page-header";
import { PriceStandardForm } from "../price-standard-form";

export default function NewPriceStandardPage() {
  return (
    <>
      <PageHeader
        title="New price standard"
        description="Add a typical price range for the app to compare scans against."
      />
      <PriceStandardForm mode="create" />
    </>
  );
}
