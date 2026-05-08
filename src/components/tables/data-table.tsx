import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/formatting/class-name";

type DataTableProps = {
  columns: string[];
  children: ReactNode;
  emptyTitle?: string;
  className?: string;
};

export function DataTable({ columns, children, emptyTitle, className }: DataTableProps) {
  const hasRows = Boolean(children);

  if (!hasRows && emptyTitle) {
    return <EmptyState title={emptyTitle} />;
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-normal text-muted">
            <tr>
              {columns.map((column) => (
                <th className="border-b border-border px-4 py-3" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
