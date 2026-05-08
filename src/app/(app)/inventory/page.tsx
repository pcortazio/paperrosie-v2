import Link from "next/link";

import { DataTable } from "@/components/tables/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listPr2InventoryCounts } from "@/lib/supabase/queries/inventory";
import { createClient } from "@/lib/supabase/server";

export default async function InventoryPage() {
  const client = await createClient();
  const { data, error } = await listPr2InventoryCounts(client);

  if (error) throw new Error(error.message);

  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <Link className="inline-flex h-10 items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white shadow-sm hover:bg-[#dc4f7c]" href="/inventory/new">
            New count
          </Link>
        }
        title="Inventory"
      />
      {data?.length ? (
        <DataTable columns={["Date", "Status", "Active", "Actions"]}>
          {data.map((count) => (
            <tr key={count.id}>
              <td className="px-4 py-3">{count.counted_at}</td>
              <td className="px-4 py-3"><StatusBadge tone={count.status === "completed" ? "accent" : count.status === "cancelled" ? "warning" : "neutral"}>{count.status}</StatusBadge></td>
              <td className="px-4 py-3">{count.active ? "Active" : "Inactive"}</td>
              <td className="px-4 py-3">
                <Link className="text-sm font-medium text-accent hover:underline" href={`/inventory/${count.id}`}>Open</Link>
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="No inventory counts found" />
      )}
    </div>
  );
}
