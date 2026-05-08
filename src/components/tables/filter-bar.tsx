import type { ReactNode } from "react";

type FilterBarProps = {
  children: ReactNode;
};

export function FilterBar({ children }: FilterBarProps) {
  return <div className="grid gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-5">{children}</div>;
}
