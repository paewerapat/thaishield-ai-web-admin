import { PartnerLocationForm } from "../partner-location-form";

export default function NewPartnerLocationPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold">New Partner Location</h1>
      <div className="mt-4">
        <PartnerLocationForm mode="create" />
      </div>
    </div>
  );
}
