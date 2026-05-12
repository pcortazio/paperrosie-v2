"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Circle,
  G,
  Rect,
} from "@react-pdf/renderer";
import type { Quote } from "@/lib/types/database";

// ── Palette ──────────────────────────────────────────────────────────────────
const ROSE       = "#c37787";
const ROSE_LIGHT = "#f5dde4";
const ROSE_PALE  = "#fdf4f6";
const DARK       = "#1c1c1e";
const MUTED      = "#6b7280";
const SUBTLE     = "#9ca3af";
const BORDER     = "#e5e7eb";
const BG         = "#f9fafb";
const WHITE      = "#ffffff";

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, mo, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(mo) - 1]} ${parseInt(day)}, ${y}`;
}

function fmtMoney(n: number | null | undefined) {
  if (n == null) return "—";
  return `CA$${n.toFixed(2)}`;
}

function quoteRef(id: string) {
  return `#${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 48,
    backgroundColor: WHITE,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: ROSE_LIGHT,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandText: {
    flexDirection: "column",
    gap: 3,
  },
  brandName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 7.5,
    color: MUTED,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  docBlock: {
    alignItems: "flex-end",
    gap: 3,
  },
  docTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: ROSE,
    letterSpacing: 2,
  },
  docRef: {
    fontSize: 8.5,
    color: MUTED,
    letterSpacing: 0.3,
  },
  docDate: {
    fontSize: 8,
    color: SUBTLE,
  },

  // ── Meta cards ──
  metaSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  billToCard: {
    flex: 2,
    backgroundColor: ROSE_PALE,
    borderWidth: 1,
    borderColor: ROSE_LIGHT,
    borderRadius: 5,
    padding: 12,
  },
  metaCard: {
    flex: 1,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
    padding: 12,
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: ROSE,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  metaValueMuted: {
    fontSize: 9,
    color: MUTED,
  },

  // ── Items table ──
  tableSection: {
    marginBottom: 16,
  },
  tableSectionTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: ROSE,
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: BG,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  colDesc:  { flex: 1 },
  colQty:   { width: 40, textAlign: "right" },
  colPrice: { width: 66, textAlign: "right" },
  colTotal: { width: 70, textAlign: "right" },
  thText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tdText:   { fontSize: 9,    color: DARK },
  tdMuted:  { fontSize: 9,    color: MUTED },
  tdBold:   { fontSize: 9,    color: DARK,  fontFamily: "Helvetica-Bold" },

  // ── Totals ──
  totalsOuter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  totalsBox: {
    width: 210,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
    overflow: "hidden",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  totalsDue: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: ROSE,
  },
  totalsLabel: { fontSize: 8, color: MUTED },
  totalsValue: { fontSize: 8, color: DARK },
  totalsDueLabel: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: WHITE },
  totalsDueValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: WHITE },

  // ── Notes / terms ──
  notesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  notesBox: {
    flex: 1,
    padding: 12,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
  },
  notesLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  notesText: { fontSize: 8.5, color: MUTED, lineHeight: 1.55 },

  // ── Thank-you strip ──
  thankYou: {
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: ROSE_LIGHT,
    marginBottom: 0,
  },
  thankYouText: {
    fontSize: 8,
    color: ROSE,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: SUBTLE },
});

// ── Logo mark (SVG circle badge) ────────────────────────────────────────────
function LogoBadge() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40">
      <Circle cx={20} cy={20} r={20} fill={ROSE} />
      {/* P */}
      <G>
        <Rect x={12} y={12} width={2} height={16} rx={1} fill={WHITE} />
        <Rect x={12} y={12} width={8} height={2} rx={1} fill={WHITE} />
        <Rect x={18} y={12} width={2} height={8} rx={1} fill={WHITE} />
        <Rect x={12} y={18} width={8} height={2} rx={1} fill={WHITE} />
      </G>
      {/* R */}
      <G>
        <Rect x={22} y={12} width={2} height={16} rx={1} fill={WHITE} />
        <Rect x={22} y={12} width={8} height={2} rx={1} fill={WHITE} />
        <Rect x={28} y={12} width={2} height={8} rx={1} fill={WHITE} />
        <Rect x={22} y={18} width={8} height={2} rx={1} fill={WHITE} />
        <Rect x={28} y={20} width={2} height={8} rx={1} fill={WHITE} />
      </G>
    </Svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function QuotePDF({ quote }: { quote: Quote }) {
  const items    = quote.items ?? [];
  const gross    = items.reduce((s, i) => s + i.total, 0);
  const discount = quote.discount ?? 0;
  const total    = quote.total ?? Math.max(0, gross - discount);
  const today    = new Date().toISOString().slice(0, 10);
  const terms    = `This quote is valid until ${fmtDate(quote.expiry)}. Prices are in Canadian dollars (CAD). Payment by e-transfer upon approval.`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <LogoBadge />
            <View style={styles.brandText}>
              <Text style={styles.brandName}>Paper Rosie</Text>
              <Text style={styles.brandTagline}>handmade stationery</Text>
            </View>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitle}>QUOTE</Text>
            <Text style={styles.docRef}>{quoteRef(quote.id)}</Text>
            <Text style={styles.docDate}>Issued {fmtDate(today)}</Text>
          </View>
        </View>

        {/* ── Meta cards ── */}
        <View style={styles.metaSection}>
          <View style={styles.billToCard}>
            <Text style={styles.metaLabel}>Bill To</Text>
            <Text style={styles.metaValue}>{quote.client_name || "—"}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Quote Date</Text>
            <Text style={styles.metaValue}>{fmtDate(quote.date)}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Valid Until</Text>
            <Text style={[styles.metaValue, quote.expiry ? {} : { color: MUTED }]}>
              {fmtDate(quote.expiry)}
            </Text>
          </View>
        </View>

        {/* ── Items table ── */}
        <View style={styles.tableSection}>
          <Text style={styles.tableSectionTitle}>Items</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colDesc]}>Description</Text>
            <Text style={[styles.thText, styles.colQty]}>Qty</Text>
            <Text style={[styles.thText, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.thText, styles.colTotal]}>Amount</Text>
          </View>
          {items.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.tableRow,
                idx % 2 === 1 ? styles.tableRowAlt : {},
                idx === items.length - 1 ? styles.tableRowLast : {},
              ]}
            >
              <Text style={[styles.tdText,  styles.colDesc]}>{item.name}</Text>
              <Text style={[styles.tdMuted, styles.colQty]}>{item.qty}</Text>
              <Text style={[styles.tdMuted, styles.colPrice]}>{fmtMoney(item.price)}</Text>
              <Text style={[styles.tdBold,  styles.colTotal]}>{fmtMoney(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={styles.totalsOuter}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{fmtMoney(gross)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Discount</Text>
                <Text style={styles.totalsValue}>− {fmtMoney(discount)}</Text>
              </View>
            )}
            <View style={styles.totalsDue}>
              <Text style={styles.totalsDueLabel}>Amount Due</Text>
              <Text style={styles.totalsDueValue}>{fmtMoney(total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes + Terms ── */}
        <View style={styles.notesRow}>
          {quote.message ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{quote.message}</Text>
            </View>
          ) : null}
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Terms & Conditions</Text>
            <Text style={styles.notesText}>{terms}</Text>
          </View>
        </View>

        {/* ── Thank-you strip ── */}
        <View style={styles.thankYou}>
          <Text style={styles.thankYouText}>Thank you for your business! ♥</Text>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Paper Rosie · handmade stationery</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
