import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/formatting/class-name";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.015)] outline-none transition-colors hover:border-zinc-300 focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-muted",
        className,
      )}
      {...props}
    />
  );
}
