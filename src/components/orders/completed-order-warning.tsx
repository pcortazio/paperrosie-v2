import { WarningCallout } from "@/components/ui/warning-callout";

export function CompletedOrderWarning() {
  return (
    <WarningCallout>
      This order is completed. Stock-affecting edits are locked in this MVP to protect audit history.
    </WarningCallout>
  );
}
