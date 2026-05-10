import { createCustomerAction } from "@/app/(app)/customers/actions";
import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/ui/page-header";

export default function NewCustomerPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="New customer" />
      <CustomerForm action={createCustomerAction} />
    </div>
  );
}
