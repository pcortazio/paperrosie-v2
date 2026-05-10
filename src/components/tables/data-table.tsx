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
    <div className={cn("overflow-hidden rounded-xl border border-border/90 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.025)]", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-zinc-50/80 text-left text-[11px] font-medium uppercase tracking-normal text-muted">
            <tr>
              {columns.map((column) => (
                <th className="border-b border-border px-4 py-2.5" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border align-middle [&_tr]:align-middle [&_tr]:transition-colors [&_tr:hover]:bg-zinc-50/65 [&_td]:py-2.5 [&_td]:align-middle">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}
