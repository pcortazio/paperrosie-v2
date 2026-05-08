import { notFound } from "next/navigation";

import { updateProductAction } from "@/app/(app)/products/actions";
import { ProductForm } from "@/components/products/product-form";
import { PageHeader } from "@/components/ui/page-header";
import { listPr2ProductCategories } from "@/lib/supabase/queries/lookups";
import { listActivePr2Packaging } from "@/lib/supabase/queries/packaging";
import { getPr2Product } from "@/lib/supabase/queries/products";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Product } from "@/types/database";

type EditProductPageProps = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const client = await createClient();
  const [{ data: product, error }, { data: categories }, { data: packaging }] = await Promise.all([
    getPr2Product(client, id),
    listPr2ProductCategories(client),
    listActivePr2Packaging(client),
  ]);
  if (error || !product) notFound();

  return (
    <div className="space-y-5">
      <PageHeader title="Edit product" />
      <ProductForm action={updateProductAction.bind(null, id)} categories={categories ?? []} packaging={packaging ?? []} product={product as unknown as Pr2Product} />
    </div>
  );
}
