import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/formatting/class-name";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/15",
        className,
      )}
      {...props}
    />
  );
}
