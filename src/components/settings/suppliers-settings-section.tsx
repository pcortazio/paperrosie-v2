import Link from "next/link";

import { ActiveStateForm } from "@/components/forms/active-state-form";
import { Card } from "@/components/ui/card";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import type { Pr2Supplier } from "@/types/database";

type SuppliersSettingsSectionProps = {
  action: (formData: FormData) => void | Promise<void>;
  suppliers: Pr2Supplier[];
};

export function SuppliersSettingsSection({ action, suppliers }: SuppliersSettingsSectionProps) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Suppliers</h2>
        <Link className="text-sm font-medium text-muted hover:text-accent" href="/suppliers/new">
          New supplier
        </Link>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border/80 bg-zinc-50/30">
        {suppliers.map((supplier) => (
          <div className="grid items-center gap-3 p-2 sm:grid-cols-[1fr_auto_auto_auto]" key={supplier.id}>
            <span className="text-sm font-medium">{supplier.name}</span>
            <ActiveStateBadge active={supplier.active} />
            <Link
              className="text-sm font-medium text-muted hover:text-accent"
              href={`/suppliers/${supplier.id}/edit`}
            >
              Edit
            </Link>
            <ActiveStateForm action={action} active={supplier.active} id={supplier.id} />
          </div>
        ))}
      </div>
    </Card>
  );
}
