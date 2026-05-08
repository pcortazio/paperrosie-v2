import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/formatting/class-name";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15",
        className,
      )}
      {...props}
    />
  );
}
