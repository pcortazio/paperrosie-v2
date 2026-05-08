import Link from "next/link";
import { notFound } from "next/navigation";

import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { WarningCallout } from "@/components/ui/warning-callout";
import { formatCurrency, formatQuantity } from "@/lib/formatting/currency";
import { getPr2Material } from "@/lib/supabase/queries/materials";
import { createClient } from "@/lib/supabase/server";
import type {
  Pr2Material,
  Pr2MaterialCategory,
  Pr2Supplier,
  Pr2Unit,
} from "@/types/database";

type MaterialDetailRow = Pr2Material & {
  category: Pr2MaterialCategory | null;
  preferred_supplier: Pr2Supplier | null;
  unit: Pr2Unit | null;
};

type MaterialDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MaterialDetailPage({ params }: MaterialDetailPageProps) {
  const { id } = await params;
  const client = await createClient();
  const { data, error } = await getPr2Material(client, id);

  if (error || !data) {
    notFound();
  }

  const material = data as unknown as MaterialDetailRow;

  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-zinc-50"
            href={`/materials/${material.id}/edit`}
          >
            Edit
          </Link>
        }
        title={material.name}
      />
      {!material.active ? (
        <WarningCallout>
          This item is inactive. It remains here for history, but you may want to replace it.
        </WarningCallout>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-medium">Material info</h2>
            <ActiveStateBadge active={material.active} />
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Category</dt>
              <dd className="mt-1 text-foreground">{material.category?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Unit</dt>
              <dd className="mt-1 text-foreground">{material.unit?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Current stock</dt>
              <dd className="mt-1 text-foreground">{formatQuantity(material.current_stock)}</dd>
            </div>
            <div>
              <dt className="text-muted">Minimum stock</dt>
              <dd className="mt-1 text-foreground">{formatQuantity(material.minimum_stock)}</dd>
            </div>
            <div>
              <dt className="text-muted">Reference cost</dt>
              <dd className="mt-1 text-foreground">
                {formatCurrency(material.reference_cost_per_unit)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Preferred supplier</dt>
              <dd className="mt-1 text-foreground">
                {material.preferred_supplier?.name ?? "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Notes</dt>
              <dd className="mt-1 whitespace-pre-wrap text-foreground">{material.notes || "—"}</dd>
            </div>
          </dl>
        </Card>
        <div className="grid gap-3">
          <Card>
            <p className="text-sm text-muted">Best price</p>
            <p className="mt-2 text-sm text-foreground">—</p>
          </Card>
          <Card>
            <p className="text-sm text-muted">Fastest delivery</p>
            <p className="mt-2 text-sm text-foreground">—</p>
          </Card>
          <Card>
            <p className="text-sm text-muted">Average delivery</p>
            <p className="mt-2 text-sm text-foreground">—</p>
          </Card>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <EmptyState title="Purchase history" />
        <EmptyState title="Products using this material" />
        <EmptyState title="Packaging using this material" />
      </div>
    </div>
  );
}
