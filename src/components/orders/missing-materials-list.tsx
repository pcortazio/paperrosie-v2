import Link from "next/link";

import { formatQuantity } from "@/lib/formatting/currency";
import type { OrderReadinessLine } from "@/lib/orders/stock-readiness";

type MissingMaterialsListProps = {
  lines: OrderReadinessLine[];
};

export function MissingMaterialsList({ lines }: MissingMaterialsListProps) {
  const missing = lines.filter((line) => line.missingQuantity > 0);
  if (!missing.length) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-amber-900">Missing materials</h2>
        <Link className="text-sm font-medium text-accent hover:underline" href="/shopping-list?source=orders">
          View missing materials
        </Link>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-amber-800">
        {missing.map((line) => (
          <li key={line.materialId}>
            {line.materialName}: missing {formatQuantity(line.missingQuantity)}
          </li>
        ))}
      </ul>
    </div>
  );
}
