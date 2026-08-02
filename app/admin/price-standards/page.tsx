import Link from "next/link";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import {
  deletePriceStandardFormAction,
  listPriceStandards,
} from "@/lib/actions/price-standards";

export default async function PriceStandardsPage() {
  let items;
  try {
    items = await listPriceStandards();
  } catch (error) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Price Standards</h1>
        <div className="mt-4">
          <DataErrorNotice error={error} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Price Standards</h1>
        <Link
          href="/admin/price-standards/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          New
        </Link>
      </div>

      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500">
            <th className="py-2 pr-4">ID</th>
            <th className="py-2 pr-4">Name (EN)</th>
            <th className="py-2 pr-4">Category</th>
            <th className="py-2 pr-4">Range (THB)</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-neutral-400">
                No price standards yet.
              </td>
            </tr>
          )}
          {items.map((item) => (
            <tr key={item.id} className="border-b border-neutral-100">
              <td className="py-2 pr-4 font-mono text-xs">{item.id}</td>
              <td className="py-2 pr-4">{item.name_en}</td>
              <td className="py-2 pr-4">{item.category}</td>
              <td className="py-2 pr-4">
                {item.min_price}–{item.max_price}
              </td>
              <td className="py-2 pr-4 text-right">
                <div className="flex justify-end gap-3">
                  <Link
                    href={`/admin/price-standards/${item.id}/edit`}
                    className="text-neutral-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <form action={deletePriceStandardFormAction}>
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
