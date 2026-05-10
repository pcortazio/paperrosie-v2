import { notFound } from "next/navigation";
import { NextRequest } from "next/server";

import { renderQuotePdf } from "@/lib/pdf/quote-pdf";
import { getPr2Quote } from "@/lib/supabase/queries/quotes";
import { createClient } from "@/lib/supabase/server";
import type { Pr2Customer, Pr2Packaging, Pr2Product, Pr2ProductVariant, Pr2Quote, Pr2QuoteItem } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuotePdfRow = Pr2Quote & {
  customer: Pr2Customer | null;
  items: Array<Pr2QuoteItem & {
    packaging: Pr2Packaging | null;
    product: Pr2Product | null;
    variant: Pr2ProductVariant | null;
  }>;
};

type QuotePdfRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: QuotePdfRouteProps) {
  const { id } = await params;
  const language = ["br", "pt"].includes(request.nextUrl.searchParams.get("lang") ?? "") ? "br" : "en";
  const client = await createClient();
  const { data, error } = await getPr2Quote(client, id);

  if (error || !data) notFound();

  const quote = data as unknown as QuotePdfRow;
  const pdf = await renderQuotePdf(quote, language);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Disposition": `inline; filename="${quote.quote_number}-${language}.pdf"`,
      "Content-Type": "application/pdf",
    },
  });
}
