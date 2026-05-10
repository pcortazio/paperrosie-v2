import type { ReactNode } from "react";

type WarningCalloutProps = {
  children: ReactNode;
};

export function WarningCallout({ children }: WarningCalloutProps) {
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-800">
      {children}
    </div>
  );
}
