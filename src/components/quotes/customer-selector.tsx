import { Select } from "@/components/ui/select";
import type { Pr2Customer } from "@/types/database";

type CustomerSelectorProps = {
  customers: Pr2Customer[];
  defaultValue?: string;
};

export function CustomerSelector({ customers, defaultValue }: CustomerSelectorProps) {
  return (
    <Select defaultValue={defaultValue ?? ""} name="customerId">
      <option value="">All customers</option>
      {customers.map((customer) => (
        <option key={customer.id} value={customer.id}>{customer.name}</option>
      ))}
    </Select>
  );
}
