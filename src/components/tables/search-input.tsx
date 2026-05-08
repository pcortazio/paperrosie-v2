import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

type SearchInputProps = {
  defaultValue?: string;
  name?: string;
  placeholder?: string;
};

export function SearchInput({ defaultValue, name = "search", placeholder = "Search" }: SearchInputProps) {
  return (
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <Input className="pl-9" defaultValue={defaultValue} name={name} placeholder={placeholder} />
    </div>
  );
}
