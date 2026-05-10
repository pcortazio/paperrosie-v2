"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost";
};

export function SubmitButton({ children, pendingLabel = "Saving", variant = "primary" }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" variant={variant}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
