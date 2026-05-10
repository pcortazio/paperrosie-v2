import { createOrderFromQuoteAction } from "@/app/(app)/orders/actions";

type CreateOrderFromQuoteButtonProps = {
  disabled?: boolean;
  quoteId: string;
};

export function CreateOrderFromQuoteButton({ disabled, quoteId }: CreateOrderFromQuoteButtonProps) {
  return (
    <form action={createOrderFromQuoteAction}>
      <input name="quote_id" type="hidden" value={quoteId} />
      <button
        className="h-10 rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:border-border disabled:bg-zinc-50 disabled:text-muted"
        disabled={disabled}
        type="submit"
      >
        Create order from quote
      </button>
    </form>
  );
}
