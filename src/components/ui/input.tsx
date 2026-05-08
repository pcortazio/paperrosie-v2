import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/formatting/class-name";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/15",
        className,
      )}
      {...props}
    />
  );
}
