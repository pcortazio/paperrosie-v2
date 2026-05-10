import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/formatting/class-name";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.015)] outline-none transition-colors placeholder:text-muted/75 hover:border-zinc-300 focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-muted",
        className,
      )}
      {...props}
    />
  );
}
