import { Card } from "@/components/ui/card";
import type { Json } from "@/types/database";

type PricingSnapshotViewerProps = {
  snapshot: Json;
};

export function PricingSnapshotViewer({ snapshot }: PricingSnapshotViewerProps) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;

  return (
    <Card className="bg-zinc-50">
      <pre className="max-h-64 overflow-auto text-xs text-muted">{JSON.stringify(snapshot, null, 2)}</pre>
    </Card>
  );
}
