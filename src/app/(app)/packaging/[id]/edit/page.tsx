import { notFound } from "next/navigation";

import { updatePackagingAction } from "@/app/(app)/packaging/actions";
import { PackagingForm } from "@/components/packaging/packaging-form";
import { PageHeader } from "@/components/ui/page-header";
import { getPr2Packaging } from "@/lib/supabase/queries/packaging";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Packaging } from "@/types/database";

type EditPackagingPageProps = { params: Promise<{ id: string }> };

export default async function EditPackagingPage({ params }: EditPackagingPageProps) {
  const { id } = await params;
  const client = await createClient();
  const { data, error } = await getPr2Packaging(client, id);
  if (error || !data) notFound();

  return (
    <div className="space-y-5">
      <PageHeader title="Edit packaging" />
      <PackagingForm action={updatePackagingAction.bind(null, id)} packaging={data as unknown as Pr2Packaging} />
    </div>
  );
}
