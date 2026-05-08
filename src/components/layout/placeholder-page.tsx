import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description} />
      <EmptyState title={`${title} is ready for Phase 2`} />
    </div>
  );
}
