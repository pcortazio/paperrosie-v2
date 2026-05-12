"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Packaging, Supplier } from "@/lib/types/database";

type SupplierOption = Pick<Supplier, "id" | "name">;
import tp from "@/components/ui/table-page.module.css";
import m from "@/components/ui/modal.module.css";

const EMPTY_FORM = {
  name: "", type: "", dims: "", cost: "", supplier_id: "", color: "", notes: "",
};
type FormData = typeof EMPTY_FORM;

export default function PackagingView() {
  const supabase = createClient();
  const [items, setItems] = useState<Packaging[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Packaging | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: pkg }, { data: sups }] = await Promise.all([
      supabase.from("pr_packaging").select("*").order("name"),
      supabase.from("pr_suppliers").select("id,name").eq("active", true).order("name"),
    ]);
    setItems(pkg ?? []);
    setSuppliers(sups ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    dialogRef.current?.showModal();
  }

  function openEdit(p: Packaging) {
    setEditing(p);
    setForm({
      name: p.name, type: p.type ?? "", dims: p.dims ?? "",
      cost: p.cost?.toString() ?? "", supplier_id: p.supplier_id ?? "",
      color: p.color ?? "", notes: p.notes ?? "",
    });
    dialogRef.current?.showModal();
  }

  function closeModal() { dialogRef.current?.close(); }

  function f(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((d) => ({ ...d, [key]: e.target.value }));
  }

  async function remove(p: Packaging) {
    if (!confirm(`Remover "${p.name}"?`)) return;
    await supabase.from("pr_packaging").delete().eq("id", p.id);
    load();
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type || null,
      dims: form.dims || null,
      cost: form.cost ? +form.cost : null,
      supplier_id: form.supplier_id || null,
      color: form.color || null,
      notes: form.notes || null,
    };
    if (editing) {
      await supabase.from("pr_packaging").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("pr_packaging").insert(payload);
    }
    setSaving(false);
    closeModal();
    load();
  }

  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  const visible = items.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.type ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className={tp.page}>
        <div className={tp.header}>
          <span className={tp.heading}>
            {items.length} embalagem{items.length !== 1 ? "ens" : ""}
          </span>
          <button className={tp.btnPrimary} onClick={openNew}>
            <span className="material-symbols-outlined">add</span>
            Nova embalagem
          </button>
        </div>

        <div className={tp.controls}>
          <div className={tp.searchWrap}>
            <span className={`${tp.searchIcon} material-symbols-outlined`}>search</span>
            <input
              className={tp.searchInput}
              placeholder="Buscar por nome ou tipo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={tp.tableWrap}>
          {loading ? (
            <div className={tp.empty}><span className={tp.emptyText}>Carregando…</span></div>
          ) : visible.length === 0 ? (
            <div className={tp.empty}>
              <span className={`${tp.emptyIcon} material-symbols-outlined`}>deployed_code</span>
              <p className={tp.emptyText}>{search ? "Nenhum resultado" : "Nenhuma embalagem cadastrada"}</p>
              {!search && <p className={tp.emptySub}>Clique em "Nova embalagem" para começar.</p>}
            </div>
          ) : (
            <table className={tp.table}>
              <thead>
                <tr>
                  <th className={tp.th}>Nome</th>
                  <th className={tp.th}>Tipo</th>
                  <th className={tp.th}>Dimensões</th>
                  <th className={tp.th}>Custo</th>
                  <th className={tp.th}>Fornecedor</th>
                  <th className={tp.th}></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className={tp.tr}>
                    <td className={tp.td}>
                      <span className={tp.cellName}>{p.name}</span>
                      {p.color && (
                        <span className={tp.tdMuted} style={{ display: "block", fontSize: 11, marginTop: 2 }}>
                          {p.color}
                        </span>
                      )}
                    </td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>{p.type ?? "—"}</td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>{p.dims ?? "—"}</td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>
                      {p.cost != null ? `CA$${p.cost.toFixed(2).replace(".", ",")}` : "—"}
                    </td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>
                      {p.supplier_id ? supplierMap[p.supplier_id] ?? "—" : "—"}
                    </td>
                    <td className={tp.tdActions}>
                      <div className={tp.rowActions}>
                        <button className={tp.btnIcon} onClick={() => openEdit(p)} title="Editar">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className={tp.btnIcon} onClick={() => remove(p)} title="Remover">
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

      <dialog
        ref={dialogRef}
        className={m.dialog}
      >
        <div className={m.header}>
          <span className={m.title}>{editing ? "Editar embalagem" : "Nova embalagem"}</span>
          <button className={m.closeBtn} onClick={closeModal}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className={m.body}>
          <div className={m.field}>
            <label className={m.label}>Nome *</label>
            <input className={m.input} value={form.name} onChange={f("name")} placeholder="Ex: Caixa kraft A5" />
          </div>
          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Tipo</label>
              <input className={m.input} value={form.type} onChange={f("type")} placeholder="Caixa, Saco, Etiqueta…" />
            </div>
            <div className={m.field}>
              <label className={m.label}>Cor</label>
              <input className={m.input} value={form.color} onChange={f("color")} placeholder="Kraft, Branco…" />
            </div>
          </div>
          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Dimensões</label>
              <input className={m.input} value={form.dims} onChange={f("dims")} placeholder="Ex: 15x20cm" />
            </div>
            <div className={m.field}>
              <label className={m.label}>Custo (CA$)</label>
              <input className={m.input} type="number" value={form.cost} onChange={f("cost")} min={0} step="any" placeholder="0.00" />
            </div>
          </div>
          {suppliers.length > 0 && (
            <div className={m.field}>
              <label className={m.label}>Fornecedor</label>
              <select className={m.select} value={form.supplier_id} onChange={f("supplier_id")}>
                <option value="">—</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
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
