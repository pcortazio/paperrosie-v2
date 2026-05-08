import { createPackagingAction } from "@/app/(app)/packaging/actions";
import { PackagingForm } from "@/components/packaging/packaging-form";
import { PageHeader } from "@/components/ui/page-header";

export default function NewPackagingPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="New packaging" />
      <PackagingForm action={createPackagingAction} />
    </div>
  );
}
