import type { ReactNode } from "react";

type WarningCalloutProps = {
  children: ReactNode;
};

export function WarningCallout({ children }: WarningCalloutProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {children}
    </div>
  );
}
