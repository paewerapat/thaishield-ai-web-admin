import { AlertZoneForm } from "../alert-zone-form";

export default function NewAlertZonePage() {
  return (
    <div>
      <h1 className="text-xl font-semibold">New Alert Zone</h1>
      <div className="mt-4">
        <AlertZoneForm mode="create" />
      </div>
    </div>
  );
}
