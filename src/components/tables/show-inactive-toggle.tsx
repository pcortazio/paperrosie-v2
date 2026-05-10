type ShowInactiveToggleProps = {
  defaultChecked?: boolean;
};

export function ShowInactiveToggle({ defaultChecked = false }: ShowInactiveToggleProps) {
  return (
    <label className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted hover:bg-zinc-50">
      <input name="activeState" type="hidden" value="active" />
      <input
        className="size-4 rounded border-border text-accent accent-accent"
        defaultChecked={defaultChecked}
        name="activeState"
        type="checkbox"
        value="all"
      />
      <span>Show inactive</span>
    </label>
  );
}
