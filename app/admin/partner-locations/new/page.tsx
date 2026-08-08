import { PageHeader } from "@/components/admin/page-header";
import { PartnerLocationForm } from "../partner-location-form";

export default function NewPartnerLocationPage() {
  return (
    <>
      <PageHeader
        title="New partner"
        description="Add a partner pin to the app's Smart Map."
      />
      <PartnerLocationForm mode="create" />
    </>
  );
}
