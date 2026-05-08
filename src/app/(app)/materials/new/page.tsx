import { createMaterialAction } from "@/app/(app)/materials/actions";
import { MaterialForm } from "@/components/materials/material-form";
import { PageHeader } from "@/components/ui/page-header";
import {
  listActivePr2MaterialCategories,
  listActivePr2Suppliers,
  listActivePr2Units,
} from "@/lib/supabase/queries/lookups";
import { createClient } from "@/lib/supabase/server";

export default async function NewMaterialPage() {
  const client = await createClient();
  const [{ data: categories }, { data: suppliers }, { data: units }] = await Promise.all([
    listActivePr2MaterialCategories(client),
    listActivePr2Suppliers(client),
    listActivePr2Units(client),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="New material" />
      <MaterialForm
        action={createMaterialAction}
        categories={categories ?? []}
        suppliers={suppliers ?? []}
        units={units ?? []}
      />
    </div>
  );
}
