import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/formatting/class-name";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-white shadow-[0_6px_16px_rgba(244,95,146,0.16)] hover:bg-[#e95386]",
  secondary: "border-border bg-surface text-foreground hover:border-zinc-300 hover:bg-zinc-50",
  ghost: "border-transparent bg-transparent text-muted shadow-none hover:bg-zinc-50 hover:text-foreground",
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg border px-3.5 text-sm font-medium shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
