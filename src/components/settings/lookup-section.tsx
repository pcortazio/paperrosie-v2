import { SubmitButton } from "@/components/forms/submit-button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  Pr2MaterialCategory,
  Pr2ProductCategory,
  Pr2TableName,
  Pr2Unit,
} from "@/types/database";

type LookupItem = Pr2Unit | Pr2MaterialCategory | Pr2ProductCategory;

type LookupSectionProps = {
  createAction: (formData: FormData) => void | Promise<void>;
  items: LookupItem[];
  table: Pr2TableName;
  title: string;
  updateAction: (formData: FormData) => void | Promise<void>;
  activeAction: (formData: FormData) => void | Promise<void>;
  withAbbreviation?: boolean;
};

export function LookupSection({
  activeAction,
  createAction,
  items,
  table,
  title,
  updateAction,
  withAbbreviation = false,
}: LookupSectionProps) {
  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <form action={createAction} className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
        <Input name="name" placeholder="Name" required />
        {withAbbreviation ? (
          <Input name="abbreviation" placeholder="Unit" required />
        ) : (
          <span className="hidden sm:block" />
        )}
        <SubmitButton pendingLabel="Adding" variant="secondary">Add</SubmitButton>
      </form>
      <div className="divide-y divide-border rounded-xl border border-border/80 bg-zinc-50/30">
        {items.map((item) => (
          <div className="grid items-center gap-2 p-2 lg:grid-cols-[1fr_120px_auto_auto]" key={item.id}>
            <form action={updateAction} className="contents">
              <input name="id" type="hidden" value={item.id} />
              <Input defaultValue={item.name} name="name" required />
              {withAbbreviation && "abbreviation" in item ? (
                <Input defaultValue={item.abbreviation} name="abbreviation" required />
              ) : (
                <span className="hidden lg:block" />
              )}
              <SubmitButton pendingLabel="Saving" variant="ghost">Save</SubmitButton>
            </form>
            <form action={activeAction}>
              <input name="id" type="hidden" value={item.id} />
              <input name="table" type="hidden" value={table} />
              <input name="active" type="hidden" value={item.active ? "false" : "true"} />
              <SubmitButton pendingLabel={item.active ? "Deactivating" : "Reactivating"} variant="ghost">
                {item.active ? "Deactivate" : "Reactivate"}
              </SubmitButton>
            </form>
          </div>
        ))}
      </div>
    </Card>
  );
}
