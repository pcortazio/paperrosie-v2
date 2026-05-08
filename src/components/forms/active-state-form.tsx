"use client";

import { SubmitButton } from "@/components/forms/submit-button";

type ActiveStateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  active: boolean;
  id: string;
};

export function ActiveStateForm({ action, active, id }: ActiveStateFormProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          active ? "Deactivate this item?" : "Reactivate this item?",
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      <input name="active" type="hidden" value={active ? "false" : "true"} />
      <SubmitButton pendingLabel={active ? "Deactivating" : "Reactivating"}>
        {active ? "Deactivate" : "Reactivate"}
      </SubmitButton>
    </form>
  );
}
