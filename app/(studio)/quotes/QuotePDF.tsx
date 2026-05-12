"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Quote } from "@/lib/types/database";

// ── Palette ──────────────────────────────────────────────────────────────────
const ROSE = "#e99495";
const ROSE_LIGHT = "#fcd6ce";
const DARK = "#1a1a1a";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const BG = "#fafafa";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 44,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    borderBottomWidth: 2,
    borderBottomColor: ROSE_LIGHT,
    paddingBottom: 16,
  },
  brandBlock: {
    flexDirection: "column",
    gap: 2,
  },
  brandName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: ROSE,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 8,
    color: MUTED,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  docTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textAlign: "right",
  },
  docSubtitle: {
    fontSize: 8,
    color: MUTED,
    textAlign: "right",
    marginTop: 3,
  },

  // ── Meta row ──
  metaRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 22,
  },
  metaCard: {
    flex: 1,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 10,
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 9,
    color: DARK,
    fontFamily: "Helvetica-Bold",
  },

  // ── Section ──
  sectionTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  // ── Items table ──
  tableHeader: {
    flexDirection: "row",
    backgroundColor: ROSE_LIGHT,
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: BG,
  },
  colDesc: { flex: 1 },
  colQty: { width: 40, textAlign: "right" },
  colPrice: { width: 60, textAlign: "right" },
  colTotal: { width: 64, textAlign: "right" },
  thText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tdText: { fontSize: 9, color: DARK },
  tdMuted: { fontSize: 9, color: MUTED },
  tdBold: { fontSize: 9, color: DARK, fontFamily: "Helvetica-Bold" },

  // ── Totals ──
  totalsBlock: {
    marginTop: 12,
    alignSelf: "flex-end",
    width: 200,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: "hidden",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  totalsRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: ROSE_LIGHT,
  },
  totalsLabel: { fontSize: 8, color: MUTED },
  totalsValue: { fontSize: 8, color: DARK },
  totalsFinalLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK },
  totalsFinalValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK },

  // ── Message / notes ──
  messageBox: {
    marginTop: 22,
    padding: 12,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  messageText: { fontSize: 8.5, color: MUTED, lineHeight: 1.5 },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: MUTED },
});

function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, mo, day] = d.split("-");
  return `${day}/${mo}/${y}`;
}

function fmtCA$(n: number | null | undefined) {
  if (n == null) return "—";
  return `CA$${n.toFixed(2).replace(".", ",")}`;
}

export default function QuotePDF({ quote }: { quote: Quote }) {
  const items = quote.items ?? [];
  const gross = items.reduce((s, i) => s + i.total, 0);
  const discount = quote.discount ?? 0;
  const total = quote.total ?? Math.max(0, gross - discount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>Paper Rosie</Text>
            <Text style={styles.brandTagline}>handmade · stationery</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>ORÇAMENTO</Text>
            <Text style={styles.docSubtitle}>
              Emitido em {fmtDate(new Date().toISOString().slice(0, 10))}
            </Text>
          </View>
        </View>

        {/* ── Meta ── */}
        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Cliente</Text>
            <Text style={styles.metaValue}>{quote.client_name || "—"}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Data</Text>
            <Text style={styles.metaValue}>{fmtDate(quote.date)}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Válido até</Text>
            <Text style={styles.metaValue}>{fmtDate(quote.expiry)}</Text>
          </View>
        </View>

        {/* ── Items ── */}
        <Text style={styles.sectionTitle}>Itens</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colDesc]}>Descrição</Text>
          <Text style={[styles.thText, styles.colQty]}>Qtd</Text>
          <Text style={[styles.thText, styles.colPrice]}>Preço unit.</Text>
          <Text style={[styles.thText, styles.colTotal]}>Total</Text>
        </View>
        {items.map((item, idx) => (
          <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tdText, styles.colDesc]}>{item.name}</Text>
            <Text style={[styles.tdMuted, styles.colQty]}>{item.qty}</Text>
            <Text style={[styles.tdMuted, styles.colPrice]}>{fmtCA$(item.price)}</Text>
            <Text style={[styles.tdBold, styles.colTotal]}>{fmtCA$(item.total)}</Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{fmtCA$(gross)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Desconto</Text>
              <Text style={styles.totalsValue}>− {fmtCA$(discount)}</Text>
            </View>
          )}
          <View style={styles.totalsRowFinal}>
            <Text style={styles.totalsFinalLabel}>Total</Text>
            <Text style={styles.totalsFinalValue}>{fmtCA$(total)}</Text>
          </View>
        </View>

        {/* ── Message ── */}
        {quote.message && (
          <View style={styles.messageBox}>
            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Observações</Text>
            <Text style={styles.messageText}>{quote.message}</Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Paper Rosie · handmade stationery</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
