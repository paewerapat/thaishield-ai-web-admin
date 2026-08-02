import Link from "next/link";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import {
  deletePartnerLocationFormAction,
  listPartnerLocations,
} from "@/lib/actions/partner-locations";

export default async function PartnerLocationsPage() {
  let items;
  try {
    items = await listPartnerLocations();
  } catch (error) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Partner Locations</h1>
        <div className="mt-4">
          <DataErrorNotice error={error} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Partner Locations</h1>
        <Link
          href="/admin/partner-locations/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          New
        </Link>
      </div>

      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Rating</th>
            <th className="py-2 pr-4">Price tier</th>
            <th className="py-2 pr-4">Verified</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-neutral-400">
                No partner locations yet.
              </td>
            </tr>
          )}
          {items.map((item) => (
            <tr key={item.id} className="border-b border-neutral-100">
              <td className="py-2 pr-4">{item.name}</td>
              <td className="py-2 pr-4">{item.type}</td>
              <td className="py-2 pr-4">{item.rating.toFixed(1)}</td>
              <td className="py-2 pr-4">{item.price_tier}</td>
              <td className="py-2 pr-4">{item.is_verified ? "Yes" : "No"}</td>
              <td className="py-2 pr-4 text-right">
                <div className="flex justify-end gap-3">
                  <Link
                    href={`/admin/partner-locations/${item.id}/edit`}
                    className="text-neutral-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <form action={deletePartnerLocationFormAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
