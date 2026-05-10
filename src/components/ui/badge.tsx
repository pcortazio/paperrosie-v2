import type { HTMLAttributes } from "react";

import { cn } from "@/lib/formatting/class-name";

type BadgeTone = "neutral" | "accent" | "warning";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const tones: Record<BadgeTone, string> = {
  neutral: "border-border bg-zinc-50 text-muted",
  accent: "border-accent/20 bg-accent/10 text-accent",
  warning: "border-amber-200/80 bg-amber-50/80 text-amber-700",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0 text-[11px] font-medium leading-5",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
