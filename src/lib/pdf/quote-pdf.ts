import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

import { formatCurrency } from "@/lib/formatting/currency";
import type {
  Pr2Customer,
  Pr2Packaging,
  Pr2Product,
  Pr2ProductVariant,
  Pr2Quote,
  Pr2QuoteItem,
} from "@/types/database";

type QuotePdfLanguage = "br" | "en";

type QuotePdfData = Pr2Quote & {
  customer: Pr2Customer | null;
  items: Array<
    Pr2QuoteItem & {
      packaging: Pr2Packaging | null;
      product: Pr2Product | null;
      variant: Pr2ProductVariant | null;
    }
  >;
};

const labels = {
  br: {
    customer: "Cliente",
    date: "Data",
    discount: "Desconto",
    finalTotal: "Total final",
    notes: "Observa\u00e7\u00f5es",
    packaging: "Embalagem",
    product: "Produto",
    quantity: "Quantidade",
    quote: "Or\u00e7amento",
    subtotal: "Subtotal",
    total: "Total",
    unitPrice: "Pre\u00e7o unit\u00e1rio",
    variant: "Variante",
  },
  en: {
    customer: "Customer",
    date: "Date",
    discount: "Discount",
    finalTotal: "Final total",
    notes: "Notes",
    packaging: "Packaging",
    product: "Product",
    quantity: "Quantity",
    quote: "Quote",
    subtotal: "Subtotal",
    total: "Total",
    unitPrice: "Unit price",
    variant: "Variant",
  },
} satisfies Record<QuotePdfLanguage, Record<string, string>>;

export async function renderQuotePdf(quote: QuotePdfData, language: QuotePdfLanguage) {
  const t = labels[language];
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.fillColor("#222222").font("Helvetica").fontSize(18).text("Paper Rosie");
  doc.fillColor("#F05A8A").fontSize(24).text(`${t.quote} ${quote.quote_number}`);
  doc.moveDown();
  doc.fillColor("#222222").fontSize(10);
  doc.text(`${t.customer}: ${quote.customer?.name ?? "-"}`);
  doc.text(
    `${t.date}: ${new Date(quote.created_at).toLocaleDateString(
      language === "br" ? "pt-BR" : "en-CA",
    )}`,
  );
  doc.moveDown();

  const y = doc.y;
  doc.lineWidth(1).rect(48, y, 500, 22).stroke("#ECECEC");
  doc.font("Helvetica-Bold").fontSize(9);
  doc.text(t.product, 54, y + 7, { width: 130 });
  doc.text(t.variant, 184, y + 7, { width: 90 });
  doc.text(t.packaging, 274, y + 7, { width: 90 });
  doc.text(t.quantity, 364, y + 7, { width: 50 });
  doc.text(t.unitPrice, 414, y + 7, { align: "right", width: 65 });
  doc.text(t.total, 479, y + 7, { align: "right", width: 60 });
  doc.font("Helvetica").moveDown(2);

  quote.items
    .filter((item) => item.active)
    .forEach((item) => {
      const rowY = doc.y;
      doc.fontSize(9).fillColor("#222222");
      doc.text(item.product?.name ?? "-", 54, rowY, { width: 130 });
      doc.text(item.variant?.name ?? "-", 184, rowY, { width: 90 });
      doc.text(item.packaging?.name ?? "-", 274, rowY, { width: 90 });
      doc.text(String(item.quantity), 364, rowY, { width: 50 });
      doc.text(formatCurrency(item.unit_price), 414, rowY, { align: "right", width: 65 });
      doc.text(formatCurrency(item.total_price), 479, rowY, { align: "right", width: 60 });
      doc.moveDown(1.2);
    });

  doc.moveDown();
  doc.fontSize(10);
  doc.text(`${t.subtotal}: ${formatCurrency(quote.subtotal)}`, { align: "right" });
  doc.text(`${t.discount}: ${formatCurrency(quote.discount)}`, { align: "right" });
  doc
    .font("Helvetica-Bold")
    .fillColor("#F05A8A")
    .text(`${t.finalTotal}: ${formatCurrency(quote.total)}`, { align: "right" });
  doc.moveDown();
  doc.font("Helvetica").fillColor("#222222").text(`${t.notes}:`);
  doc.fillColor("#666666").text(quote.notes || "-");
  doc.end();

  return done;
}
