import type { ReactNode } from "react";

type FilterBarProps = {
  children: ReactNode;
};

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="grid gap-2 rounded-xl bg-surface/80 p-2 sm:grid-cols-2 lg:grid-cols-5">
      {children}
    </div>
  );
}
