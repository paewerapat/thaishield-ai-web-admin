import { PageHeader } from "@/components/admin/page-header";
import { AlertZoneForm } from "../alert-zone-form";

export default function NewAlertZonePage() {
  return (
    <>
      <PageHeader
        title="New alert zone"
        description="Draw a travel-advisory area boundary for the app's Smart Map."
      />
      <AlertZoneForm mode="create" />
    </>
  );
}
