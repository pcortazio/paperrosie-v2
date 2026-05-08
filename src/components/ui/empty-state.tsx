import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center text-center">
      <h2 className="text-base font-medium text-foreground">{title}</h2>
      {description ? <p className="mt-2 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
