"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus, Quote, Material } from "@/lib/types/database";
import Badge from "@/components/ui/Badge";
import s from "./dashboard.module.css";

type RecentOrder = Pick<Order, "id" | "date" | "client_name" | "status" | "total">;
type PendingQuote = Pick<Quote, "id" | "date" | "expiry" | "client_name" | "total">;
type ZeroMat = Pick<Material, "id" | "name" | "unit">;

const STATUS_LABELS: Record<OrderStatus, string> = {
  novo: "Novo",
  producao: "Em produção",
  pronto: "Pronto",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, "blue" | "purple" | "amber" | "green" | "gray"> = {
  novo: "blue",
  producao: "purple",
  pronto: "amber",
  enviado: "blue",
  entregue: "green",
  cancelado: "gray",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, mo, day] = d.split("-");
  return `${day}/${mo}/${y}`;
}

function fmtCA$(n: number | null | undefined) {
  if (n == null) return "—";
  return `CA$${n.toFixed(2).replace(".", ",")}`;
}

function firstDayOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

type DashData = {
  activeOrders: number;
  pendingQuotes: number;
  activeProducts: number;
  monthRevenue: number;
  recentOrders: RecentOrder[];
  openQuotes: PendingQuote[];
  zeroMaterials: ZeroMat[];
};

export default function DashboardView() {
  const supabase = createClient();
  const [data, setData] = useState<DashData | null>(null);

  const load = useCallback(async () => {
    const [
      { count: activeOrders },
      { count: pendingQuotes },
      { count: activeProducts },
      { data: monthOrders },
      { data: recentOrders },
      { data: openQuotes },
      { data: zeroMaterials },
    ] = await Promise.all([
      supabase
        .from("pr_orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["novo", "producao", "pronto"]),
      supabase
        .from("pr_quotes")
        .select("*", { count: "exact", head: true })
        .eq("status", "orcamento"),
      supabase
        .from("pr_products")
        .select("*", { count: "exact", head: true })
        .eq("active", true),
      supabase
        .from("pr_orders")
        .select("total")
        .eq("status", "entregue")
        .gte("date", firstDayOfMonth()),
      supabase
        .from("pr_orders")
        .select("id,date,client_name,status,total")
        .order("date", { ascending: false })
        .limit(6),
      supabase
        .from("pr_quotes")
        .select("id,date,expiry,client_name,total")
        .eq("status", "orcamento")
        .order("date", { ascending: false })
        .limit(5),
      supabase
        .from("pr_materials")
        .select("id,name,unit")
        .eq("active", true)
        .eq("qty", 0),
    ]);

    const monthRevenue = (monthOrders ?? []).reduce(
      (sum, o) => sum + (o.total ?? 0),
      0
    );

    setData({
      activeOrders: activeOrders ?? 0,
      pendingQuotes: pendingQuotes ?? 0,
      activeProducts: activeProducts ?? 0,
      monthRevenue,
      recentOrders: (recentOrders ?? []) as RecentOrder[],
      openQuotes: (openQuotes ?? []) as PendingQuote[],
      zeroMaterials: (zeroMaterials ?? []) as ZeroMat[],
    });
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  if (!data) {
    return <div className={s.loading}>Carregando…</div>;
  }

  const { activeOrders, pendingQuotes, activeProducts, monthRevenue, recentOrders, openQuotes, zeroMaterials } = data;

  return (
    <div className={s.page}>
      {/* ── Metric cards ── */}
      <div className={s.cards}>
        <MetricCard
          label="Pedidos ativos"
          value={activeOrders}
          sub="novo · em produção · pronto"
          href="/orders"
        />
        <MetricCard
          label="Orçamentos pendentes"
          value={pendingQuotes}
          sub="aguardando resposta"
          href="/quotes"
        />
        <MetricCard
          label="Produtos ativos"
          value={activeProducts}
          sub="no catálogo"
          href="/products"
        />
        <MetricCard
          label="Faturamento do mês"
          value={fmtCA$(monthRevenue)}
          sub="pedidos entregues"
          href="/orders"
          isText
        />
      </div>

      {/* ── Main grid ── */}
      <div className={s.grid}>
        {/* Left — recent orders */}
        <div className={s.panel}>
          <div className={s.panelHeader}>
            <span className={s.panelTitle}>Pedidos recentes</span>
            <Link
              href="/orders"
              style={{ fontSize: 12, color: "var(--rs-color-foreground-muted)", textDecoration: "none" }}
            >
              Ver todos →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className={s.emptyPanel}>Nenhum pedido registrado ainda.</div>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th className={s.th}>Data</th>
                  <th className={s.th}>Cliente</th>
                  <th className={s.th}>Total</th>
                  <th className={s.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className={s.tr}>
                    <td className={`${s.td} ${s.tdMuted}`}>{fmtDate(o.date)}</td>
                    <td className={s.td}>
                      <span style={{ fontWeight: 500 }}>{o.client_name || "—"}</span>
                    </td>
                    <td className={`${s.td} ${s.tdBold}`}>{fmtCA$(o.total)}</td>
                    <td className={s.td}>
                      <Badge
                        label={STATUS_LABELS[o.status]}
                        color={STATUS_COLORS[o.status]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div className={s.col}>
          {/* Pending quotes */}
          <div className={s.panel}>
            <div className={s.panelHeader}>
              <span className={s.panelTitle}>Orçamentos abertos</span>
              {openQuotes.length > 0 && (
                <span className={s.panelCount}>{openQuotes.length}</span>
              )}
            </div>
            {openQuotes.length === 0 ? (
              <div className={s.emptyPanel}>Nenhum orçamento pendente.</div>
            ) : (
              openQuotes.map((q) => (
                <div key={q.id} className={s.listItem}>
                  <span className={s.listItemName}>{q.client_name || "—"}</span>
                  <span className={s.listItemSub}>{fmtCA$(q.total)}</span>
                  <span className={s.listItemSub} style={{ minWidth: 72, textAlign: "right" }}>
                    até {fmtDate(q.expiry)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Zero stock */}
          <div className={s.panel}>
            <div className={s.panelHeader}>
              <span className={s.panelTitle}>Materiais sem estoque</span>
              {zeroMaterials.length > 0 && (
                <span className={s.panelCount}>{zeroMaterials.length}</span>
              )}
            </div>
            {zeroMaterials.length === 0 ? (
              <div className={s.emptyPanel}>Todos os materiais têm estoque.</div>
            ) : (
              zeroMaterials.map((mat) => (
                <div key={mat.id} className={s.listItem}>
                  <span className={s.listItemName}>{mat.name}</span>
                  <span className={s.listItemSub} style={{ color: "#dc2626", fontWeight: 600 }}>
                    0 {mat.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  href,
  isText = false,
}: {
  label: string;
  value: number | string;
  sub: string;
  href: string;
  isText?: boolean;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div className={s.card} style={{ cursor: "pointer" }}>
        <div className={s.cardAccent} />
        <span className={s.cardLabel}>{label}</span>
        <span className={s.cardValue} style={isText ? { fontSize: 22 } : {}}>
          {value}
        </span>
        <span className={s.cardSub}>{sub}</span>
      </div>
    </Link>
  );
}
