import { PriceStandardForm } from "../price-standard-form";

export default function NewPriceStandardPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold">New Price Standard</h1>
      <div className="mt-4">
        <PriceStandardForm mode="create" />
      </div>
    </div>
  );
}
