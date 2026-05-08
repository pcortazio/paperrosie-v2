import { createProductAction } from "@/app/(app)/products/actions";
import { ProductForm } from "@/components/products/product-form";
import { PageHeader } from "@/components/ui/page-header";
import { listPr2ProductCategories } from "@/lib/supabase/queries/lookups";
import { listActivePr2Packaging } from "@/lib/supabase/queries/packaging";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const client = await createClient();
  const [{ data: categories }, { data: packaging }] = await Promise.all([
    listPr2ProductCategories(client),
    listActivePr2Packaging(client),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="New product" />
      <ProductForm action={createProductAction} categories={categories ?? []} packaging={packaging ?? []} />
    </div>
  );
}
