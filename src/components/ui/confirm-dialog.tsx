"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  action: () => void;
  confirmLabel: string;
  title: string;
  triggerLabel: string;
  variant?: "primary" | "secondary" | "ghost";
};

export function ConfirmDialog({
  action,
  confirmLabel,
  title,
  triggerLabel,
  variant = "secondary",
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button" variant={variant}>
        {triggerLabel}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 px-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-lg">
            <h2 className="text-base font-medium text-foreground">{title}</h2>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setOpen(false)} type="button" variant="ghost">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setOpen(false);
                  action();
                }}
                type="button"
                variant="primary"
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
