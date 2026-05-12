"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Material, Supplier } from "@/lib/types/database";

type SupplierOption = Pick<Supplier, "id" | "name">;
import Badge from "@/components/ui/Badge";
import tp from "@/components/ui/table-page.module.css";
import m from "@/components/ui/modal.module.css";

const UNITS = ["un", "g", "kg", "ml", "L", "cm", "m", "folha", "rolo", "par", "kit"];

const EMPTY_FORM = {
  name: "", cat: "", price: "", qty: "", unit: "un", notes: "",
  supplier_ids: [] as string[],
};
type FormData = typeof EMPTY_FORM;

function fmtCurrency(n: number | null) {
  if (n == null) return "—";
  return `CA$${n.toFixed(2).replace(".", ",")}`;
}

function fmtQty(n: number | null, unit: string | null) {
  if (n == null) return "—";
  return `${n} ${unit ?? ""}`.trim();
}

export default function MaterialsView() {
  const supabase = createClient();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("true");
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: mats }, { data: sups }] = await Promise.all([
      supabase.from("pr_materials").select("*").order("name"),
      supabase.from("pr_suppliers").select("id,name").eq("active", true).order("name"),
    ]);
    setMaterials(mats ?? []);
    setSuppliers(sups ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // Auto-calculate unit cost from price and qty
  const unitCost =
    form.price && form.qty && +form.qty > 0
      ? +form.price / +form.qty
      : null;

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    dialogRef.current?.showModal();
  }

  function openEdit(mat: Material) {
    setEditing(mat);
    setForm({
      name: mat.name,
      cat: mat.cat ?? "",
      price: mat.price?.toString() ?? "",
      qty: mat.qty?.toString() ?? "",
      unit: mat.unit ?? "un",
      notes: mat.notes ?? "",
      supplier_ids: (mat.supplier_ids as string[]) ?? [],
    });
    dialogRef.current?.showModal();
  }

  function closeModal() { dialogRef.current?.close(); }

  function f(key: keyof Omit<FormData, "supplier_ids">) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((d) => ({ ...d, [key]: e.target.value }));
  }

  function toggleSupplier(id: string) {
    setForm((d) => ({
      ...d,
      supplier_ids: d.supplier_ids.includes(id)
        ? d.supplier_ids.filter((s) => s !== id)
        : [...d.supplier_ids, id],
    }));
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const price = form.price ? +form.price : null;
    const qty = form.qty ? +form.qty : null;
    const payload = {
      name: form.name.trim(),
      cat: form.cat || null,
      price,
      qty,
      unit: form.unit || null,
      unit_cost: price && qty && qty > 0 ? Math.round((price / qty) * 100) / 100 : null,
      notes: form.notes || null,
      supplier_ids: form.supplier_ids,
    };
    if (editing) {
      await supabase.from("pr_materials").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("pr_materials").insert({ ...payload, active: true });
    }
    setSaving(false);
    closeModal();
    load();
  }

  async function toggleActive(mat: Material) {
    await supabase.from("pr_materials").update({ active: !mat.active }).eq("id", mat.id);
    load();
  }

  const categories = [...new Set(materials.map((m) => m.cat).filter(Boolean))] as string[];

  const visible = materials.filter((mat) => {
    const q = search.toLowerCase();
    const matchSearch = !q || mat.name.toLowerCase().includes(q) || (mat.cat ?? "").toLowerCase().includes(q);
    const matchCat = !filterCat || mat.cat === filterCat;
    const matchActive = filterActive === "" || String(mat.active) === filterActive;
    return matchSearch && matchCat && matchActive;
  });

  return (
    <>
      <div className={tp.page}>
        <div className={tp.header}>
          <span className={tp.heading}>
            {materials.length} material{materials.length !== 1 ? "is" : ""}
          </span>
          <button className={tp.btnPrimary} onClick={openNew}>
            <span className="material-symbols-outlined">add</span>
            Novo material
          </button>
        </div>

        <div className={tp.controls}>
          <div className={tp.searchWrap}>
            <span className={`${tp.searchIcon} material-symbols-outlined`}>search</span>
            <input
              className={tp.searchInput}
              placeholder="Buscar por nome ou categoria…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {categories.length > 0 && (
            <select
              className={tp.filterSelect}
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          <select
            className={tp.filterSelect}
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as typeof filterActive)}
          >
            <option value="true">Ativos</option>
            <option value="">Todos</option>
            <option value="false">Inativos</option>
          </select>
        </div>

        <div className={tp.tableWrap}>
          {loading ? (
            <div className={tp.empty}><span className={tp.emptyText}>Carregando…</span></div>
          ) : visible.length === 0 ? (
            <div className={tp.empty}>
              <span className={`${tp.emptyIcon} material-symbols-outlined`}>inventory_2</span>
              <p className={tp.emptyText}>{search ? "Nenhum resultado" : "Nenhum material cadastrado"}</p>
              {!search && <p className={tp.emptySub}>Clique em "Novo material" para começar.</p>}
            </div>
          ) : (
            <table className={tp.table}>
              <thead>
                <tr>
                  <th className={tp.th}>Nome</th>
                  <th className={tp.th}>Categoria</th>
                  <th className={tp.th}>Estoque</th>
                  <th className={tp.th}>Custo/unidade</th>
                  <th className={tp.th}>Status</th>
                  <th className={tp.th}></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((mat) => (
                  <tr key={mat.id} className={tp.tr}>
                    <td className={tp.td}><span className={tp.cellName}>{mat.name}</span></td>
                    <td className={tp.td}>
                      {mat.cat ? <Badge label={mat.cat} color="gray" /> : <span className={tp.tdMuted}>—</span>}
                    </td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>{fmtQty(mat.qty, mat.unit)}</td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>{fmtCurrency(mat.unit_cost)}</td>
                    <td className={tp.td}>
                      <Badge label={mat.active ? "Ativo" : "Inativo"} color={mat.active ? "green" : "amber"} />
                    </td>
                    <td className={tp.tdActions}>
                      <div className={tp.rowActions}>
                        <button className={tp.btnIcon} onClick={() => openEdit(mat)} title="Editar">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className={tp.btnIcon} onClick={() => toggleActive(mat)} title={mat.active ? "Desativar" : "Ativar"}>
                          <span className="material-symbols-outlined">{mat.active ? "visibility_off" : "visibility"}</span>
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

      <dialog
        ref={dialogRef}
        className={m.dialog}
      >
        <div className={m.header}>
          <span className={m.title}>{editing ? "Editar material" : "Novo material"}</span>
          <button className={m.closeBtn} onClick={closeModal}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className={m.body}>
          <div className={m.field}>
            <label className={m.label}>Nome *</label>
            <input className={m.input} value={form.name} onChange={f("name")} placeholder="Nome do material" />
          </div>

          <div className={m.field}>
            <label className={m.label}>Categoria</label>
            <input className={m.input} value={form.cat} onChange={f("cat")} placeholder="Ex: Papel, Tecido…" />
          </div>

          <div className={m.sectionTitle}>Estoque e custo</div>

          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Quantidade</label>
              <input className={m.input} type="number" value={form.qty} onChange={f("qty")} min={0} step="any" placeholder="0" />
            </div>
            <div className={m.field}>
              <label className={m.label}>Unidade</label>
              <select className={m.select} value={form.unit} onChange={f("unit")}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Preço pago (CA$)</label>
              <input className={m.input} type="number" value={form.price} onChange={f("price")} min={0} step="any" placeholder="0.00" />
            </div>
            <div className={m.field}>
              <label className={m.label}>Custo/unidade (calculado)</label>
              <input
                className={m.input}
                readOnly
                value={unitCost != null ? `CA$${unitCost.toFixed(2)}` : "—"}
                style={{ background: "var(--rs-color-background-tertiary)", cursor: "default" }}
              />
            </div>
          </div>

          {suppliers.length > 0 && (
            <>
              <div className={m.sectionTitle}>Fornecedores</div>
              <SupplierCheckboxList
                suppliers={suppliers}
                selected={form.supplier_ids}
                onToggle={toggleSupplier}
              />
            </>
          )}

          <div className={m.field}>
            <label className={m.label}>Observações</label>
            <textarea className={m.textarea} value={form.notes} onChange={f("notes")} rows={2} />
          </div>
        </div>
        <div className={m.footer}>
          <button className={m.btnCancel} onClick={closeModal}>Cancelar</button>
          <button className={m.btnSave} onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </dialog>
    </>
  );
}

function SupplierCheckboxList({
  suppliers, selected, onToggle,
}: {
  suppliers: SupplierOption[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {suppliers.map((s) => {
        const checked = selected.includes(s.id);
        return (
          <label
            key={s.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: "var(--radius-xs)",
              border: `1px solid ${checked ? "var(--rose)" : "var(--rs-color-border-neutral)"}`,
              background: checked
                ? "color-mix(in srgb, var(--rose) 10%, transparent)"
                : "var(--rs-color-background-secondary)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              color: checked ? "var(--rose-dark)" : "var(--rs-color-foreground-muted)",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(s.id)}
              style={{ display: "none" }}
            />
            {checked && <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>}
            {s.name}
          </label>
        );
      })}
    </div>
  );
}
