"use client";

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
      <button
        className="inline-flex h-8 items-center rounded-lg px-2.5 text-sm font-medium text-muted hover:bg-zinc-50 hover:text-foreground"
        type="submit"
      >
        {active ? "Deactivate" : "Reactivate"}
      </button>
    </form>
  );
}
