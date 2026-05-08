import { notFound } from "next/navigation";

import { updateMaterialAction } from "@/app/(app)/materials/actions";
import { MaterialForm } from "@/components/materials/material-form";
import { ActiveStateBadge } from "@/components/ui/active-state-badge";
import { PageHeader } from "@/components/ui/page-header";
import {
  listPr2MaterialCategories,
  listPr2Suppliers,
  listPr2Units,
} from "@/lib/supabase/queries/lookups";
import { getPr2Material } from "@/lib/supabase/queries/materials";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Material } from "@/types/database";

type EditMaterialPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMaterialPage({ params }: EditMaterialPageProps) {
  const { id } = await params;
  const client = await createClient();
  const [{ data: material, error }, { data: categories }, { data: suppliers }, { data: units }] =
    await Promise.all([
      getPr2Material(client, id),
      listPr2MaterialCategories(client),
      listPr2Suppliers(client),
      listPr2Units(client),
    ]);

  if (error || !material) {
    notFound();
  }

  const action = updateMaterialAction.bind(null, material.id);

  return (
    <div className="space-y-5">
      <PageHeader actions={<ActiveStateBadge active={material.active} />} title="Edit material" />
      <MaterialForm
        action={action}
        categories={categories ?? []}
        material={material as unknown as Pr2Material}
        suppliers={suppliers ?? []}
        units={units ?? []}
      />
    </div>
  );
}
