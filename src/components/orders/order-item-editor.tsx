import { QuoteItemEditor } from "@/components/quotes/quote-item-editor";
import type { Pr2Packaging, Pr2Product, Pr2ProductVariant } from "@/types/database";

type OrderItemEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
  packaging: Pr2Packaging[];
  products: Array<Pr2Product & { variants?: Pr2ProductVariant[] }>;
};

export function OrderItemEditor(props: OrderItemEditorProps) {
  return <QuoteItemEditor {...props} />;
}
