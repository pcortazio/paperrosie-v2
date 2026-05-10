import type { ReactNode } from "react";

type FilterBarProps = {
  children: ReactNode;
};

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="grid gap-2.5 rounded-xl border border-border/90 bg-surface p-3 shadow-[0_1px_2px_rgba(0,0,0,0.025)] sm:grid-cols-2 lg:grid-cols-5">
      {children}
    </div>
  );
}
