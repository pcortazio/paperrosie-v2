import type { HTMLAttributes } from "react";

import { cn } from "@/lib/formatting/class-name";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
        className,
      )}
      {...props}
    />
  );
}
