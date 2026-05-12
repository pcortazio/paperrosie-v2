"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Client, Order, OrderStatus, Product, Settings } from "@/lib/types/database";
import Badge from "@/components/ui/Badge";
import tp from "@/components/ui/table-page.module.css";
import m from "@/components/ui/modal.module.css";

type ClientOption = Pick<Client, "id" | "name">;
type ProductOption = Pick<Product, "id" | "name" | "price">;

type ItemRow = {
  product_id: string;
  name: string;
  qty: string;
  price: string;
};

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

function rowTotal(item: ItemRow) {
  return Math.round((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0) * 100) / 100;
}

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  due_date: "",
  client_id: "",
  client_name: "",
  origin: "",
  status: "novo" as OrderStatus,
  shipping_type: "",
  ship_date: "",
  tracking: "",
  notes: "",
  items: [] as ItemRow[],
};
type FormData = typeof EMPTY_FORM;

export default function OrdersView() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [settings, setSettings] = useState<Settings["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Order | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: ords }, { data: cls }, { data: prods }, { data: sets }] = await Promise.all([
      supabase.from("pr_orders").select("*").order("date", { ascending: false }),
      supabase.from("pr_clients").select("id,name").eq("active", true).order("name"),
      supabase.from("pr_products").select("id,name,price").eq("active", true).order("name"),
      supabase.from("pr_settings").select("data").eq("id", "main").single(),
    ]);
    setOrders(ords ?? []);
    setClients(cls ?? []);
    setProducts(prods ?? []);
    setSettings((sets?.data as Settings["data"]) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const channels = settings?.dropdowns?.client_channels ?? [];
  const total = form.items.reduce((s, i) => s + rowTotal(i), 0);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) });
    dialogRef.current?.showModal();
  }

  function openEdit(o: Order) {
    setEditing(o);
    setForm({
      date: o.date ?? new Date().toISOString().slice(0, 10),
      due_date: o.due_date ?? "",
      client_id: o.client_id ?? "",
      client_name: o.client_name ?? "",
      origin: o.origin ?? "",
      status: o.status,
      shipping_type: o.shipping_type ?? "",
      ship_date: o.ship_date ?? "",
      tracking: o.tracking ?? "",
      notes: o.notes ?? "",
      items: (o.items ?? []).map((i) => ({
        product_id: i.product_id,
        name: i.name,
        qty: i.qty.toString(),
        price: i.price.toString(),
      })),
    });
    dialogRef.current?.showModal();
  }

  function closeModal() { dialogRef.current?.close(); }

  function f(key: keyof Omit<FormData, "items">) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((d) => {
        const next = { ...d, [key]: value };
        if (key === "client_id" && value) {
          next.client_name = clientMap[value] ?? d.client_name;
        }
        return next;
      });
    };
  }

  function addProduct(prod: ProductOption) {
    const existing = form.items.findIndex((i) => i.product_id === prod.id);
    if (existing >= 0) {
      setForm((d) => ({
        ...d,
        items: d.items.map((i, idx) =>
          idx === existing
            ? { ...i, qty: (parseFloat(i.qty) + 1).toString() }
            : i
        ),
      }));
    } else {
      setForm((d) => ({
        ...d,
        items: [
          ...d.items,
          {
            product_id: prod.id,
            name: prod.name,
            qty: "1",
            price: prod.price != null ? Number(prod.price).toFixed(2) : "",
          },
        ],
      }));
    }
  }

  function removeItem(idx: number) {
    setForm((d) => ({ ...d, items: d.items.filter((_, i) => i !== idx) }));
  }

  function setItemField(idx: number, field: "qty" | "price", value: string) {
    setForm((d) => ({
      ...d,
      items: d.items.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }));
  }

  async function save() {
    if (form.items.length === 0) return;
    setSaving(true);
    const orderTotal = Math.round(form.items.reduce((s, i) => s + rowTotal(i), 0) * 100) / 100;
    const payload = {
      date: form.date || null,
      due_date: form.due_date || null,
      client_id: form.client_id || null,
      client_name: form.client_name || null,
      origin: form.origin || null,
      status: form.status,
      shipping_type: form.shipping_type || null,
      ship_date: form.ship_date || null,
      tracking: form.tracking || null,
      notes: form.notes || null,
      total: orderTotal,
      items: form.items.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        qty: parseFloat(i.qty) || 0,
        price: Math.round((parseFloat(i.price) || 0) * 100) / 100,
        total: rowTotal(i),
      })),
    };
    if (editing) {
      await supabase.from("pr_orders").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("pr_orders").insert(payload);
    }
    setSaving(false);
    closeModal();
    load();
  }

  async function remove(o: Order) {
    await supabase.from("pr_orders").delete().eq("id", o.id);
    load();
  }

  const visible = orders.filter((o) => {
    const q = search.toLowerCase();
    const clientDisplay = o.client_id ? clientMap[o.client_id] ?? o.client_name ?? "" : o.client_name ?? "";
    const matchSearch = !q || clientDisplay.toLowerCase().includes(q);
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const isShipped = ["enviado", "entregue"].includes(form.status);

  return (
    <>
      <div className={tp.page}>
        <div className={tp.header}>
          <span className={tp.heading}>
            {orders.length} pedido{orders.length !== 1 ? "s" : ""}
          </span>
          <button className={tp.btnPrimary} onClick={openNew}>
            <span className="material-symbols-outlined">add</span>
            Novo pedido
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
            {(["novo", "producao", "pronto", "enviado", "entregue", "cancelado"] as OrderStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className={tp.tableWrap}>
          {loading ? (
            <div className={tp.empty}><span className={tp.emptyText}>Carregando…</span></div>
          ) : visible.length === 0 ? (
            <div className={tp.empty}>
              <span className={`${tp.emptyIcon} material-symbols-outlined`}>receipt_long</span>
              <p className={tp.emptyText}>{search || filterStatus ? "Nenhum resultado" : "Nenhum pedido registrado"}</p>
              {!search && !filterStatus && <p className={tp.emptySub}>Clique em "Novo pedido" para começar.</p>}
            </div>
          ) : (
            <table className={tp.table}>
              <thead>
                <tr>
                  <th className={tp.th}>Data</th>
                  <th className={tp.th}>Prazo</th>
                  <th className={tp.th}>Cliente</th>
                  <th className={tp.th}>Canal</th>
                  <th className={tp.th}>Itens</th>
                  <th className={tp.th}>Total</th>
                  <th className={tp.th}>Status</th>
                  <th className={tp.th}></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => {
                  const clientDisplay = o.client_id
                    ? clientMap[o.client_id] ?? o.client_name
                    : o.client_name;
                  return (
                    <tr key={o.id} className={tp.tr}>
                      <td className={`${tp.td} ${tp.tdMuted}`}>{fmtDate(o.date)}</td>
                      <td className={`${tp.td} ${tp.tdMuted}`}>{fmtDate(o.due_date)}</td>
                      <td className={tp.td}>
                        <span className={tp.cellName}>{clientDisplay || <span className={tp.tdMuted}>—</span>}</span>
                      </td>
                      <td className={`${tp.td} ${tp.tdMuted}`}>{o.origin ?? "—"}</td>
                      <td className={`${tp.td} ${tp.tdMuted}`}>
                        {(o.items ?? []).length} {(o.items ?? []).length === 1 ? "item" : "itens"}
                      </td>
                      <td className={tp.td} style={{ fontWeight: 600 }}>{fmtCA$(o.total)}</td>
                      <td className={tp.td}>
                        <Badge label={STATUS_LABELS[o.status]} color={STATUS_COLORS[o.status]} />
                      </td>
                      <td className={tp.tdActions}>
                        <div className={tp.rowActions}>
                          <button className={tp.btnIcon} onClick={() => openEdit(o)} title="Editar">
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className={tp.btnIcon} onClick={() => remove(o)} title="Excluir">
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
          <span className={m.title}>{editing ? "Editar pedido" : "Novo pedido"}</span>
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
              <label className={m.label}>Prazo de entrega</label>
              <input className={m.input} type="date" value={form.due_date} onChange={f("due_date")} />
            </div>
            <div className={m.field}>
              <label className={m.label}>Status</label>
              <select className={m.select} value={form.status} onChange={f("status")}>
                {(["novo", "producao", "pronto", "enviado", "entregue", "cancelado"] as OrderStatus[]).map((s) => (
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
              <label className={m.label}>Nome no pedido</label>
              <input
                className={m.input}
                value={form.client_name}
                onChange={f("client_name")}
                placeholder="Nome do cliente"
              />
            </div>
          </div>
          <div className={m.field}>
            <label className={m.label}>Canal de origem</label>
            {channels.length > 0 ? (
              <select className={m.select} value={form.origin} onChange={f("origin")}>
                <option value="">—</option>
                {channels.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            ) : (
              <input className={m.input} value={form.origin} onChange={f("origin")} placeholder="Ex: Etsy, Instagram…" />
            )}
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
                {["Produto", "Qtd", "Preço unit.", "Total", ""].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rs-color-foreground-disabled)" }}>
                    {h}
                  </span>
                ))}
              </div>

              {form.items.map((item, idx) => (
                <div
                  key={item.product_id + idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 56px 90px 72px 26px",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <span style={{
                    fontSize: 13,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "var(--rs-color-foreground-neutral)",
                  }}>
                    {item.name}
                  </span>
                  <input
                    className={m.input}
                    style={{ height: 34, textAlign: "right" }}
                    type="number"
                    min={1}
                    step={1}
                    value={item.qty}
                    onChange={(e) => setItemField(idx, "qty", e.target.value)}
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

          {/* Product picker */}
          <ProdPickerSection products={products} onAdd={addProduct} />

          {/* ── Total ── */}
          {form.items.length > 0 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              background: "var(--rs-color-background-secondary)",
              border: "1px solid var(--rs-color-border-neutral)",
              borderRadius: "var(--radius-xs)",
              fontWeight: 700,
              fontSize: 14,
            }}>
              <span>Total</span>
              <span>{fmtCA$(Math.round(total * 100) / 100)}</span>
            </div>
          )}

          {/* ── Envio ── */}
          <div className={m.sectionTitle}>Envio</div>
          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Tipo de envio</label>
              <input
                className={m.input}
                value={form.shipping_type}
                onChange={f("shipping_type")}
                placeholder="Ex: Correios PAC, Motoboy…"
              />
            </div>
            <div className={m.field}>
              <label className={m.label}>Data de envio</label>
              <input
                className={m.input}
                type="date"
                value={form.ship_date}
                onChange={f("ship_date")}
                disabled={!isShipped}
                style={!isShipped ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              />
            </div>
          </div>
          <div className={m.field}>
            <label className={m.label}>Código de rastreamento</label>
            <input
              className={m.input}
              value={form.tracking}
              onChange={f("tracking")}
              placeholder="Ex: BR123456789BR"
              disabled={!isShipped}
              style={!isShipped ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            />
          </div>

          {/* ── Observações ── */}
          <div className={m.field}>
            <label className={m.label}>Observações</label>
            <textarea className={m.textarea} rows={2} value={form.notes} onChange={f("notes")} />
          </div>
        </div>

        <div className={m.footer}>
          <button type="button" className={m.btnCancel} onClick={closeModal}>Cancelar</button>
          <button type="button" className={m.btnSave} onClick={save} disabled={saving || form.items.length === 0}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </dialog>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProdPickerSection({
  products,
  onAdd,
}: {
  products: ProductOption[];
  onAdd: (prod: ProductOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {!open ? (
        <button type="button" className={tp.btnGhost} onClick={() => setOpen(true)}>
          <span className="material-symbols-outlined">add</span>
          Adicionar produto
        </button>
      ) : (
        <div style={{ border: "1px solid var(--rs-color-border-neutral)", borderRadius: "var(--radius-xs)", overflow: "hidden" }}>
          <div style={{ position: "relative" }}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--rs-color-foreground-disabled)", pointerEvents: "none" }}>
              search
            </span>
            <input
              autoFocus
              className={m.input}
              style={{ paddingLeft: 34, borderRadius: 0, border: "none", borderBottom: "1px solid var(--rs-color-border-neutral)" }}
              placeholder="Buscar produto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 16px", fontSize: 13, color: "var(--rs-color-foreground-disabled)" }}>
                {search ? "Nenhum produto encontrado" : "Nenhum produto ativo cadastrado"}
              </div>
            ) : (
              filtered.map((p) => <ProdPickerRow key={p.id} prod={p} onAdd={(prod) => { onAdd(prod); setOpen(false); setSearch(""); }} />)
            )}
          </div>
          <div style={{ padding: 8 }}>
            <button type="button" className={m.btnCancel} style={{ height: 28, fontSize: 12 }} onClick={() => { setOpen(false); setSearch(""); }}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
        {prod.price != null ? `CA$${Number(prod.price).toFixed(2).replace(".", ",")}` : "sem preço"}
      </span>
    </button>
  );
}
