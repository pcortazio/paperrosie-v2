import Link from "next/link";

type PdfLanguageSelectorProps = {
  quoteId: string;
};

export function PdfLanguageSelector({ quoteId }: PdfLanguageSelectorProps) {
  return (
    <div className="flex gap-2">
      <Link className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm hover:bg-zinc-50" href={`/quotes/${quoteId}/pdf?lang=en`}>PDF EN</Link>
      <Link className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium shadow-sm hover:bg-zinc-50" href={`/quotes/${quoteId}/pdf?lang=br`}>PDF BR</Link>
    </div>
  );
}
