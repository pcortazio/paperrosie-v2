"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Material, Purchase, PurchaseStatus, Settings, Supplier } from "@/lib/types/database";
import { sortWithOutroLast } from "@/lib/sort";
import Badge from "@/components/ui/Badge";
import tp from "@/components/ui/table-page.module.css";
import m from "@/components/ui/modal.module.css";

type SupplierOption = Pick<Supplier, "id" | "name">;
type MaterialOption = Pick<Material, "id" | "name" | "unit">;

type ItemRow = {
  material_id: string;
  name: string;
  unit: string;
  qty: string;
  total_paid: string; // total pago pelo lote; unit_price = total_paid / qty
};

const EMPTY_FORM = {
  date: todayDisplay(),
  supplier_id: "",
  status: "planejada" as PurchaseStatus,
  payment_method: "",
  shipping: "",
  notes: "",
  items: [] as ItemRow[],
};
type FormData = typeof EMPTY_FORM;

const STATUS_LABELS: Record<PurchaseStatus, string> = {
  planejada: "Planejada",
  feita: "Feita",
  recebida: "Recebida",
};

const STATUS_COLORS: Record<PurchaseStatus, "blue" | "amber" | "green"> = {
  planejada: "blue",
  feita: "amber",
  recebida: "green",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, mo, day] = d.split("-");
  return `${day}/${mo}/${y}`;
}

function toDisplay(iso: string): string {
  if (!iso) return "";
  const [y, mo, day] = iso.split("-");
  return `${day}/${mo}/${y}`;
}

function fromDisplay(d: string): string {
  if (!d) return "";
  const [day, mo, y] = d.split("/");
  if (!day || !mo || !y || y.length < 4) return "";
  return `${y}-${mo.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function todayDisplay() {
  return toDisplay(new Date().toISOString().slice(0, 10));
}

function fmtCA$(n: number | null | undefined) {
  if (n == null) return "—";
  return `CA$${n.toFixed(2).replace(".", ",")}`;
}

function rowTotal(item: ItemRow) {
  return parseFloat(item.total_paid) || 0;
}

function rowUnitCost(item: ItemRow) {
  const qty = parseFloat(item.qty) || 0;
  const paid = parseFloat(item.total_paid) || 0;
  return qty > 0 ? paid / qty : null;
}

function computeTotal(items: ItemRow[], shipping: string) {
  const itemsSum = items.reduce((s, i) => s + rowTotal(i), 0);
  return itemsSum + (parseFloat(shipping) || 0);
}

export default function PurchasesView() {
  const supabase = createClient();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [settings, setSettings] = useState<Settings["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [matSearch, setMatSearch] = useState("");
  const [showMatPicker, setShowMatPicker] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: purch }, { data: sups }, { data: mats }, { data: sets }] = await Promise.all([
      supabase.from("pr_purchases").select("*").order("date", { ascending: false }),
      supabase.from("pr_suppliers").select("id,name").eq("active", true).order("name"),
      supabase.from("pr_materials").select("id,name,unit").eq("active", true).order("name"),
      supabase.from("pr_settings").select("data").eq("id", "main").single(),
    ]);
    setPurchases(purch ?? []);
    setSuppliers(sups ?? []);
    setMaterials(mats ?? []);
    setSettings((sets?.data as Settings["data"]) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const paymentMethods = sortWithOutroLast(settings?.dropdowns?.payment_methods ?? []);
  const total = computeTotal(form.items, form.shipping);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, date: todayDisplay() });
    setMatSearch("");
    setShowMatPicker(false);
    dialogRef.current?.showModal();
  }

  function openEdit(p: Purchase) {
    setEditing(p);
    setForm({
      date: p.date ? toDisplay(p.date) : todayDisplay(),
      supplier_id: p.supplier_id ?? "",
      status: p.status,
      payment_method: p.payment_method ?? "",
      shipping: p.shipping?.toString() ?? "",
      notes: p.notes ?? "",
      items: (p.items ?? []).map((i) => ({
        material_id: i.material_id,
        name: i.name,
        unit: i.unit,
        qty: i.qty.toString(),
        total_paid: (Math.round(i.unit_price * i.qty * 100) / 100).toFixed(2),
      })),
    });
    setMatSearch("");
    setShowMatPicker(false);
    dialogRef.current?.showModal();
  }

  function closeModal() { dialogRef.current?.close(); }

  function f(key: keyof Omit<FormData, "items">) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((d) => ({ ...d, [key]: e.target.value }));
  }

  function addItem(mat: MaterialOption) {
    if (form.items.some((i) => i.material_id === mat.id)) return;
    setForm((d) => ({
      ...d,
      items: [
        ...d.items,
        { material_id: mat.id, name: mat.name, unit: mat.unit ?? "un", qty: "1", total_paid: "" },
      ],
    }));
    setMatSearch("");
    setShowMatPicker(false);
  }

  function removeItem(id: string) {
    setForm((d) => ({ ...d, items: d.items.filter((i) => i.material_id !== id) }));
  }

  function setItemField(id: string, field: "qty" | "total_paid", value: string) {
    setForm((d) => ({
      ...d,
      items: d.items.map((i) => i.material_id === id ? { ...i, [field]: value } : i),
    }));
  }

  async function save() {
    if (form.items.length === 0) return;
    setSaving(true);
    const itemsTotal = computeTotal(form.items, form.shipping);
    const payload = {
      date: fromDisplay(form.date) || null,
      supplier_id: form.supplier_id || null,
      status: form.status,
      payment_method: form.payment_method || null,
      shipping: parseFloat(form.shipping) || 0,
      total: itemsTotal,
      cat: null,
      notes: form.notes || null,
      items: form.items.map((i) => {
        const qty = parseFloat(i.qty) || 0;
        const total = rowTotal(i);
        return {
          material_id: i.material_id,
          name: i.name,
          unit: i.unit,
          qty,
          unit_price: qty > 0 ? Math.round((total / qty) * 100) / 100 : 0,
          total,
        };
      }),
    };
    if (editing) {
      await supabase.from("pr_purchases").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("pr_purchases").insert(payload);
    }
    setSaving(false);
    closeModal();
    load();
  }

  async function remove(p: Purchase) {
    await supabase.from("pr_purchases").delete().eq("id", p.id);
    load();
  }

  const filteredMats = materials.filter(
    (mat) =>
      !form.items.some((i) => i.material_id === mat.id) &&
      (!matSearch || mat.name.toLowerCase().includes(matSearch.toLowerCase()))
  );

  const visible = purchases.filter((p) => {
    const q = search.toLowerCase();
    const supplierName = p.supplier_id ? supplierMap[p.supplier_id] ?? "" : "";
    const matchSearch = !q || supplierName.toLowerCase().includes(q) || (p.notes ?? "").toLowerCase().includes(q);
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <div className={tp.page}>
        <div className={tp.header}>
          <span className={tp.heading}>
            {purchases.length} compra{purchases.length !== 1 ? "s" : ""}
          </span>
          <button className={tp.btnPrimary} onClick={openNew}>
            <span className="material-symbols-outlined">add</span>
            Nova compra
          </button>
        </div>

        <div className={tp.controls}>
          <div className={tp.searchWrap}>
            <span className={`${tp.searchIcon} material-symbols-outlined`}>search</span>
            <input
              className={tp.searchInput}
              placeholder="Buscar por fornecedor ou notas…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className={tp.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {(["planejada", "feita", "recebida"] as PurchaseStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className={tp.tableWrap}>
          {loading ? (
            <div className={tp.empty}><span className={tp.emptyText}>Carregando…</span></div>
          ) : visible.length === 0 ? (
            <div className={tp.empty}>
              <span className={`${tp.emptyIcon} material-symbols-outlined`}>shopping_bag</span>
              <p className={tp.emptyText}>{search || filterStatus ? "Nenhum resultado" : "Nenhuma compra registrada"}</p>
              {!search && !filterStatus && <p className={tp.emptySub}>Clique em "Nova compra" para começar.</p>}
            </div>
          ) : (
            <table className={tp.table}>
              <thead>
                <tr>
                  <th className={tp.th}>Data</th>
                  <th className={tp.th}>Fornecedor</th>
                  <th className={tp.th}>Itens</th>
                  <th className={tp.th}>Frete</th>
                  <th className={tp.th}>Total</th>
                  <th className={tp.th}>Status</th>
                  <th className={tp.th}></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className={tp.tr}>
                    <td className={`${tp.td} ${tp.tdMuted}`}>{fmtDate(p.date)}</td>
                    <td className={tp.td}>
                      <span className={tp.cellName}>
                        {p.supplier_id ? supplierMap[p.supplier_id] ?? "—" : <span className={tp.tdMuted}>—</span>}
                      </span>
                    </td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>
                      {(p.items ?? []).length} {(p.items ?? []).length === 1 ? "item" : "itens"}
                    </td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>{fmtCA$(p.shipping || null)}</td>
                    <td className={`${tp.td}`} style={{ fontWeight: 600 }}>{fmtCA$(p.total)}</td>
                    <td className={tp.td}>
                      <Badge label={STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} />
                    </td>
                    <td className={tp.tdActions}>
                      <div className={tp.rowActions}>
                        <button className={tp.btnIcon} onClick={() => openEdit(p)} title="Editar">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className={tp.btnIcon} onClick={() => remove(p)} title="Excluir">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      <dialog ref={dialogRef} className={m.dialog} style={{ maxWidth: 600 }}>
        <div className={m.header}>
          <span className={m.title}>{editing ? "Editar compra" : "Nova compra"}</span>
          <button className={m.closeBtn} onClick={closeModal}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={m.body}>
          {/* ── Cabeçalho da compra ── */}
          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Data</label>
              <input className={m.input} type="text" placeholder="dd/mm/yyyy" maxLength={10} value={form.date} onChange={f("date")} />
            </div>
            <div className={m.field}>
              <label className={m.label}>Status</label>
              <select className={m.select} value={form.status} onChange={f("status")}>
                {(["planejada", "feita", "recebida"] as PurchaseStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Fornecedor</label>
              <select className={m.select} value={form.supplier_id} onChange={f("supplier_id")}>
                <option value="">—</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className={m.field}>
              <label className={m.label}>Pagamento</label>
              {paymentMethods.length > 0 ? (
                <select className={m.select} value={form.payment_method} onChange={f("payment_method")}>
                  <option value="">—</option>
                  {paymentMethods.map((pm) => <option key={pm} value={pm}>{pm}</option>)}
                </select>
              ) : (
                <input className={m.input} value={form.payment_method} onChange={f("payment_method")} placeholder="Forma de pagamento" />
              )}
            </div>
          </div>

          {/* ── Itens ── */}
          <div className={m.sectionTitle}>Itens comprados *</div>

          {form.items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {form.items.map((item) => (
                <div
                  key={item.material_id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto auto 26px",
                    gap: 8,
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "var(--rs-color-background-secondary)",
                    borderRadius: "var(--radius-xs)",
                    border: "1px solid var(--rs-color-border-neutral)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.qty}
                      onChange={(e) => setItemField(item.material_id, "qty", e.target.value)}
                      style={itemInputStyle}
                      title="Quantidade"
                    />
                    <span style={{ fontSize: 12, color: "var(--rs-color-foreground-disabled)", minWidth: 22 }}>
                      {item.unit}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--rs-color-foreground-disabled)" }}>CA$</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.total_paid}
                      onChange={(e) => setItemField(item.material_id, "total_paid", e.target.value)}
                      style={{ ...itemInputStyle, width: 72 }}
                      placeholder="0,00"
                      title="Total pago pelo lote"
                    />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--rs-color-foreground-muted)", minWidth: 80, textAlign: "right" }}>
                    {(() => {
                      const uc = rowUnitCost(item);
                      return uc != null
                        ? `= CA$${uc.toFixed(2).replace(".", ",")}/${item.unit}`
                        : "—";
                    })()}
                  </span>
                  <button
                    onClick={() => removeItem(item.material_id)}
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

          {/* Material picker */}
          {!showMatPicker ? (
            <button className={tp.btnGhost} onClick={() => setShowMatPicker(true)}>
              <span className="material-symbols-outlined">add</span>
              Adicionar material
            </button>
          ) : (
            <div style={{
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
                  placeholder="Buscar material…"
                  value={matSearch}
                  onChange={(e) => setMatSearch(e.target.value)}
                />
              </div>
              <div style={{ maxHeight: 180, overflowY: "auto" }}>
                {filteredMats.length === 0 ? (
                  <div style={{ padding: "12px 16px", fontSize: 13, color: "var(--rs-color-foreground-disabled)" }}>
                    {matSearch ? "Nenhum material encontrado" : "Todos os materiais ativos já foram adicionados"}
                  </div>
                ) : (
                  filteredMats.map((mat) => (
                    <MatPickerRow key={mat.id} mat={mat} onAdd={addItem} />
                  ))
                )}
              </div>
              <div style={{ padding: 8 }}>
                <button
                  className={m.btnCancel}
                  style={{ height: 28, fontSize: 12 }}
                  onClick={() => { setShowMatPicker(false); setMatSearch(""); }}
                >
                  Fechar
                </button>
              </div>
            </div>
          )}

          {/* ── Frete e total ── */}
          <div className={m.sectionTitle}>Frete e total</div>
          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Frete (CA$)</label>
              <input className={m.input} type="number" min={0} step="any" value={form.shipping} onChange={f("shipping")} placeholder="0,00" />
            </div>
            <div className={m.field}>
              <label className={m.label}>Total (calculado)</label>
              <input
                className={m.input}
                readOnly
                value={form.items.length > 0 || form.shipping ? `CA$${total.toFixed(2).replace(".", ",")}` : "—"}
                style={{ background: "var(--rs-color-background-tertiary)", cursor: "default", fontWeight: 600 }}
              />
            </div>
          </div>

          {/* ── Observações ── */}
          <div className={m.field}>
            <label className={m.label}>Observações</label>
            <textarea className={m.textarea} rows={2} value={form.notes} onChange={f("notes")} />
          </div>
        </div>

        <div className={m.footer}>
          <button className={m.btnCancel} onClick={closeModal}>Cancelar</button>
          <button className={m.btnSave} onClick={save} disabled={saving || form.items.length === 0}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </dialog>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const itemInputStyle: React.CSSProperties = {
  width: 64,
  height: 30,
  padding: "0 8px",
  background: "var(--rs-color-background-primary)",
  border: "1px solid var(--rs-color-border-neutral)",
  borderRadius: "var(--radius-xs)",
  fontSize: 13,
  fontFamily: "var(--font-body)",
  color: "var(--rs-color-foreground-neutral)",
  outline: "none",
  textAlign: "right",
};

function MatPickerRow({
  mat,
  onAdd,
}: {
  mat: MaterialOption;
  onAdd: (m: MaterialOption) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={() => onAdd(mat)}
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
      <span>{mat.name}</span>
      <span style={{ fontSize: 12, color: "var(--rs-color-foreground-disabled)" }}>{mat.unit ?? "un"}</span>
    </button>
  );
}
