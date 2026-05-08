import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/formatting/class-name";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-white hover:bg-[#dc4f7c]",
  secondary: "border-border bg-surface text-foreground hover:bg-zinc-50",
  ghost: "border-transparent bg-transparent text-muted hover:bg-zinc-50 hover:text-foreground",
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
        "inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
