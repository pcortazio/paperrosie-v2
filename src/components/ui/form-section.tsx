import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

type FormSectionProps = {
  title: string;
  children: ReactNode;
};

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <Card className="space-y-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </Card>
  );
}
