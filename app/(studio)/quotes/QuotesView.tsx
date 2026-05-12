"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Client, Product, Quote, QuoteStatus, Settings } from "@/lib/types/database";
import Badge from "@/components/ui/Badge";
import tp from "@/components/ui/table-page.module.css";
import m from "@/components/ui/modal.module.css";

type ClientOption = Pick<Client, "id" | "name">;
type ProductOption = Pick<Product, "id" | "name" | "price">;

type ItemRow = {
  product_id: string | null;
  name: string;
  qty: string;
  price: string;
};

const STATUS_LABELS: Record<QuoteStatus, string> = {
  orcamento: "Orçamento",
  aprovado: "Aprovado",
  recusado: "Recusado",
  expirado: "Expirado",
};

const STATUS_COLORS: Record<QuoteStatus, "blue" | "green" | "gray" | "amber"> = {
  orcamento: "blue",
  aprovado: "green",
  recusado: "gray",
  expirado: "amber",
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

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function rowTotal(item: ItemRow) {
  return Math.round((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0) * 100) / 100;
}

function computeTotal(items: ItemRow[], discount: string) {
  const gross = items.reduce((s, i) => s + rowTotal(i), 0);
  return Math.max(0, Math.round((gross - (parseFloat(discount) || 0)) * 100) / 100);
}

function makeEmptyForm(settings: Settings["data"] | null): FormData {
  const today = new Date().toISOString().slice(0, 10);
  const validityDays = settings?.quote_validity_days ?? 30;
  return {
    date: today,
    expiry: addDays(today, validityDays),
    client_id: "",
    client_name: "",
    status: "orcamento",
    discount: "",
    message: "",
    items: [],
  };
}

type FormData = {
  date: string;
  expiry: string;
  client_id: string;
  client_name: string;
  status: QuoteStatus;
  discount: string;
  message: string;
  items: ItemRow[];
};

export default function QuotesView() {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [settings, setSettings] = useState<Settings["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Quote | null>(null);
  const [form, setForm] = useState<FormData>(() => makeEmptyForm(null));
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [showProdPicker, setShowProdPicker] = useState(false);
  const [prodSearch, setProdSearch] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: qs }, { data: cls }, { data: prods }, { data: sets }] = await Promise.all([
      supabase.from("pr_quotes").select("*").order("date", { ascending: false }),
      supabase.from("pr_clients").select("id,name").eq("active", true).order("name"),
      supabase.from("pr_products").select("id,name,price").eq("active", true).order("name"),
      supabase.from("pr_settings").select("data").eq("id", "main").single(),
    ]);
    setQuotes(qs ?? []);
    setClients(cls ?? []);
    setProducts(prods ?? []);
    setSettings((sets?.data as Settings["data"]) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const gross = form.items.reduce((s, i) => s + rowTotal(i), 0);
  const total = computeTotal(form.items, form.discount);
  const discountAmt = parseFloat(form.discount) || 0;

  function openNew() {
    setEditing(null);
    setForm(makeEmptyForm(settings));
    setShowProdPicker(false);
    setProdSearch("");
    dialogRef.current?.showModal();
  }

  function openEdit(q: Quote) {
    setEditing(q);
    setForm({
      date: q.date ?? new Date().toISOString().slice(0, 10),
      expiry: q.expiry ?? "",
      client_id: q.client_id ?? "",
      client_name: q.client_name ?? "",
      status: q.status,
      discount: q.discount ? q.discount.toString() : "",
      message: q.message ?? "",
      items: (q.items ?? []).map((i) => ({
        product_id: i.product_id,
        name: i.name,
        qty: i.qty.toString(),
        price: i.price.toString(),
      })),
    });
    setShowProdPicker(false);
    setProdSearch("");
    dialogRef.current?.showModal();
  }

  function closeModal() { dialogRef.current?.close(); }

  function f(key: keyof Omit<FormData, "items">) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((d) => {
        const next = { ...d, [key]: value };
        // When client is selected, pre-fill client_name
        if (key === "client_id" && value) {
          next.client_name = clientMap[value] ?? d.client_name;
        }
        return next;
      });
    };
  }

  function addProduct(prod: ProductOption) {
    setForm((d) => ({
      ...d,
      items: [
        ...d.items,
        {
          product_id: prod.id,
          name: prod.name,
          qty: "1",
          price: prod.price?.toFixed(2) ?? "",
        },
      ],
    }));
    setShowProdPicker(false);
    setProdSearch("");
  }

  function removeItem(idx: number) {
    setForm((d) => ({ ...d, items: d.items.filter((_, i) => i !== idx) }));
  }

  function setItemField(idx: number, field: keyof ItemRow, value: string) {
    setForm((d) => ({
      ...d,
      items: d.items.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }));
  }

  async function save() {
    if (form.items.length === 0) return;
    setSaving(true);
    const payload = {
      date: form.date || null,
      expiry: form.expiry || null,
      client_id: form.client_id || null,
      client_name: form.client_name || null,
      status: form.status,
      discount: parseFloat(form.discount) || 0,
      total: computeTotal(form.items, form.discount),
      message: form.message || null,
      items: form.items.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        qty: parseFloat(i.qty) || 0,
        price: Math.round((parseFloat(i.price) || 0) * 100) / 100,
        total: rowTotal(i),
      })),
    };
    if (editing) {
      await supabase.from("pr_quotes").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("pr_quotes").insert(payload);
    }
    setSaving(false);
    closeModal();
    load();
  }

  async function downloadPDF(q: Quote) {
    setGeneratingPdf(q.id);
    try {
      const [{ pdf }, { default: QuotePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./QuotePDF"),
      ]);
      const blob = await pdf(<QuotePDF quote={q} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orcamento-${(q.client_name ?? q.id).replace(/\s+/g, "-").toLowerCase()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setGeneratingPdf(null);
    }
  }

  async function convertToOrder(q: Quote) {
    setConverting(q.id);
    await supabase.from("pr_orders").insert({
      date: new Date().toISOString().slice(0, 10),
      client_id: q.client_id,
      client_name: q.client_name,
      status: "novo",
      items: (q.items ?? []).map((i) => ({
        product_id: i.product_id ?? "",
        name: i.name,
        qty: i.qty,
        price: i.price,
        total: i.total,
      })),
      total: q.total,
      notes: q.message || null,
    });
    setConverting(null);
    load();
  }

  async function remove(q: Quote) {
    await supabase.from("pr_quotes").delete().eq("id", q.id);
    load();
  }

  const filteredProds = products.filter(
    (p) => !prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const visible = quotes.filter((q) => {
    const q2 = search.toLowerCase();
    const clientName = q.client_id ? clientMap[q.client_id] ?? "" : q.client_name ?? "";
    const matchSearch = !q2 || clientName.toLowerCase().includes(q2);
    const matchStatus = !filterStatus || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const canSave = form.items.length > 0 && form.items.every((i) => i.name.trim());

  return (
    <>
      <div className={tp.page}>
        <div className={tp.header}>
          <span className={tp.heading}>
            {quotes.length} orçamento{quotes.length !== 1 ? "s" : ""}
          </span>
          <button className={tp.btnPrimary} onClick={openNew}>
            <span className="material-symbols-outlined">add</span>
            Novo orçamento
          </button>
        </div>

        <div className={tp.controls}>
          <div className={tp.searchWrap}>
            <span className={`${tp.searchIcon} material-symbols-outlined`}>search</span>
            <input
              className={tp.searchInput}
              placeholder="Buscar por cliente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className={tp.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {(["orcamento", "aprovado", "recusado", "expirado"] as QuoteStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className={tp.tableWrap}>
          {loading ? (
            <div className={tp.empty}><span className={tp.emptyText}>Carregando…</span></div>
          ) : visible.length === 0 ? (
            <div className={tp.empty}>
              <span className={`${tp.emptyIcon} material-symbols-outlined`}>request_quote</span>
              <p className={tp.emptyText}>{search || filterStatus ? "Nenhum resultado" : "Nenhum orçamento criado"}</p>
              {!search && !filterStatus && <p className={tp.emptySub}>Clique em "Novo orçamento" para começar.</p>}
            </div>
          ) : (
            <table className={tp.table}>
              <thead>
                <tr>
                  <th className={tp.th}>Data</th>
                  <th className={tp.th}>Validade</th>
                  <th className={tp.th}>Cliente</th>
                  <th className={tp.th}>Itens</th>
                  <th className={tp.th}>Total</th>
                  <th className={tp.th}>Status</th>
                  <th className={tp.th}></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((q) => {
                  const clientDisplay = q.client_id
                    ? clientMap[q.client_id] ?? q.client_name
                    : q.client_name;
                  return (
                    <tr key={q.id} className={tp.tr}>
                      <td className={`${tp.td} ${tp.tdMuted}`}>{fmtDate(q.date)}</td>
                      <td className={`${tp.td} ${tp.tdMuted}`}>{fmtDate(q.expiry)}</td>
                      <td className={tp.td}>
                        <span className={tp.cellName}>{clientDisplay || <span className={tp.tdMuted}>—</span>}</span>
                      </td>
                      <td className={`${tp.td} ${tp.tdMuted}`}>
                        {(q.items ?? []).length} {(q.items ?? []).length === 1 ? "item" : "itens"}
                      </td>
                      <td className={tp.td} style={{ fontWeight: 600 }}>{fmtCA$(q.total)}</td>
                      <td className={tp.td}>
                        <Badge label={STATUS_LABELS[q.status]} color={STATUS_COLORS[q.status]} />
                      </td>
                      <td className={tp.tdActions}>
                        <div className={tp.rowActions}>
                          <button
                            className={tp.btnIcon}
                            onClick={() => downloadPDF(q)}
                            title="Gerar PDF"
                            disabled={generatingPdf === q.id}
                          >
                            <span className="material-symbols-outlined">
                              {generatingPdf === q.id ? "hourglass_empty" : "picture_as_pdf"}
                            </span>
                          </button>
                          {q.status === "aprovado" && (
                            <button
                              className={tp.btnIcon}
                              onClick={() => convertToOrder(q)}
                              title="Converter em pedido"
                              disabled={converting === q.id}
                            >
                              <span className="material-symbols-outlined">
                                {converting === q.id ? "hourglass_empty" : "shopping_bag"}
                              </span>
                            </button>
                          )}
                          <button className={tp.btnIcon} onClick={() => openEdit(q)} title="Editar">
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className={tp.btnIcon} onClick={() => remove(q)} title="Excluir">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      <dialog ref={dialogRef} className={m.dialog} style={{ maxWidth: 620 }}>
        <div className={m.header}>
          <span className={m.title}>{editing ? "Editar orçamento" : "Novo orçamento"}</span>
          <button type="button" className={m.closeBtn} onClick={closeModal}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={m.body}>
          {/* ── Datas e status ── */}
          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Data</label>
              <input className={m.input} type="date" value={form.date} onChange={f("date")} />
            </div>
            <div className={m.field}>
              <label className={m.label}>Válido até</label>
              <input className={m.input} type="date" value={form.expiry} onChange={f("expiry")} />
            </div>
            <div className={m.field}>
              <label className={m.label}>Status</label>
              <select className={m.select} value={form.status} onChange={f("status")}>
                {(["orcamento", "aprovado", "recusado", "expirado"] as QuoteStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Cliente ── */}
          <div className={m.sectionTitle}>Cliente</div>
          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Cadastrado</label>
              <select className={m.select} value={form.client_id} onChange={f("client_id")}>
                <option value="">—</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className={m.field}>
              <label className={m.label}>Nome no orçamento</label>
              <input
                className={m.input}
                value={form.client_name}
                onChange={f("client_name")}
                placeholder="Nome do destinatário"
              />
            </div>
          </div>

          {/* ── Itens ── */}
          <div className={m.sectionTitle}>Itens *</div>

          {form.items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 56px 90px 72px 26px",
                gap: 8,
                padding: "0 4px",
              }}>
                {["Descrição", "Qtd", "Preço unit.", "Total", ""].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rs-color-foreground-disabled)" }}>
                    {h}
                  </span>
                ))}
              </div>

              {form.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 56px 90px 72px 26px",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    className={m.input}
                    style={{ height: 34 }}
                    value={item.name}
                    onChange={(e) => setItemField(idx, "name", e.target.value)}
                    placeholder="Descrição do item"
                  />
                  <input
                    className={m.input}
                    style={{ height: 34, textAlign: "right" }}
                    type="number"
                    min={0}
                    step="any"
                    value={item.qty}
                    onChange={(e) => setItemField(idx, "qty", e.target.value)}
                    placeholder="1"
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ fontSize: 11, color: "var(--rs-color-foreground-disabled)", flexShrink: 0 }}>CA$</span>
                    <input
                      className={m.input}
                      style={{ height: 34, textAlign: "right" }}
                      type="number"
                      min={0}
                      step="any"
                      value={item.price}
                      onChange={(e) => setItemField(idx, "price", e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", color: "var(--rs-color-foreground-neutral)" }}>
                    {fmtCA$(rowTotal(item))}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 26, height: 26,
                      background: "transparent", border: "none",
                      borderRadius: "var(--radius-xs)",
                      color: "var(--rs-color-foreground-disabled)",
                      cursor: "pointer",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!showProdPicker ? (
              <button type="button" className={tp.btnGhost} onClick={() => setShowProdPicker(true)}>
                <span className="material-symbols-outlined">add</span>
                Produto do catálogo
              </button>
            ) : (
              <div style={{
                width: "100%",
                border: "1px solid var(--rs-color-border-neutral)",
                borderRadius: "var(--radius-xs)",
                overflow: "hidden",
              }}>
                <div style={{ position: "relative" }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                      fontSize: 16, color: "var(--rs-color-foreground-disabled)", pointerEvents: "none",
                    }}
                  >
                    search
                  </span>
                  <input
                    autoFocus
                    className={m.input}
                    style={{ paddingLeft: 34, borderRadius: 0, border: "none", borderBottom: "1px solid var(--rs-color-border-neutral)" }}
                    placeholder="Buscar produto…"
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                  />
                </div>
                <div style={{ maxHeight: 180, overflowY: "auto" }}>
                  {filteredProds.length === 0 ? (
                    <div style={{ padding: "12px 16px", fontSize: 13, color: "var(--rs-color-foreground-disabled)" }}>
                      {prodSearch ? "Nenhum produto encontrado" : "Nenhum produto ativo cadastrado"}
                    </div>
                  ) : (
                    filteredProds.map((p) => (
                      <ProdPickerRow key={p.id} prod={p} onAdd={addProduct} />
                    ))
                  )}
                </div>
                <div style={{ padding: 8 }}>
                  <button
                    type="button"
                    className={m.btnCancel}
                    style={{ height: 28, fontSize: 12 }}
                    onClick={() => { setShowProdPicker(false); setProdSearch(""); }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Desconto e total ── */}
          <div className={m.sectionTitle}>Desconto e total</div>
          <div style={{
            border: "1px solid var(--rs-color-border-neutral)",
            borderRadius: "var(--radius-xs)",
            overflow: "hidden",
            fontSize: 13,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 12px",
              borderBottom: "1px solid var(--rs-color-border-neutral)",
              color: "var(--rs-color-foreground-muted)",
            }}>
              <span>Subtotal</span>
              <span>{fmtCA$(gross)}</span>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 12px",
              borderBottom: "1px solid var(--rs-color-border-neutral)",
              gap: 12,
            }}>
              <span style={{ color: "var(--rs-color-foreground-muted)", flexShrink: 0 }}>Desconto (CA$)</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={form.discount}
                  onChange={f("discount")}
                  placeholder="0,00"
                  style={{
                    width: 90,
                    height: 30,
                    padding: "0 8px",
                    background: "var(--rs-color-background-secondary)",
                    border: "1px solid var(--rs-color-border-neutral)",
                    borderRadius: "var(--radius-xs)",
                    fontSize: 13,
                    fontFamily: "var(--font-body)",
                    color: "var(--rs-color-foreground-neutral)",
                    outline: "none",
                    textAlign: "right",
                  }}
                />
              </div>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px",
              fontWeight: 700,
              fontSize: 14,
              background: "var(--rs-color-background-secondary)",
            }}>
              <span>Total</span>
              <span>{discountAmt > 0 ? fmtCA$(total) : fmtCA$(gross)}</span>
            </div>
          </div>

          {/* ── Mensagem ── */}
          <div className={m.field}>
            <label className={m.label}>Mensagem ao cliente</label>
            <textarea
              className={m.textarea}
              rows={3}
              value={form.message}
              onChange={f("message")}
              placeholder="Observações, condições de pagamento, prazo de entrega…"
            />
          </div>
        </div>

        <div className={m.footer}>
          <button type="button" className={m.btnCancel} onClick={closeModal}>Cancelar</button>
          <button type="button" className={m.btnSave} onClick={save} disabled={saving || !canSave}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </dialog>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProdPickerRow({ prod, onAdd }: { prod: ProductOption; onAdd: (p: ProductOption) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onAdd(prod)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "9px 16px",
        background: hover ? "var(--rs-color-background-secondary)" : "transparent",
        border: "none",
        borderBottom: "1px solid var(--rs-color-border-neutral)",
        cursor: "pointer",
        textAlign: "left",
        fontSize: 13,
        fontFamily: "var(--font-body)",
        color: "var(--rs-color-foreground-neutral)",
        transition: "background 0.1s",
      }}
    >
      <span>{prod.name}</span>
      <span style={{ fontSize: 12, color: "var(--rs-color-foreground-disabled)" }}>
        {prod.price != null ? `CA$${prod.price.toFixed(2).replace(".", ",")}` : "sem preço"}
      </span>
    </button>
  );
}
