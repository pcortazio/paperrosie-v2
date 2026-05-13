"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Supplier, Settings } from "@/lib/types/database";
import { sortWithOutroLast } from "@/lib/sort";
import Badge from "@/components/ui/Badge";
import tp from "@/components/ui/table-page.module.css";
import m from "@/components/ui/modal.module.css";

const EMPTY_FORM = {
  name: "", type: "", channel: "" as "" | "online" | "fisico",
  website: "", email: "", phone: "", city: "", province: "", notes: "",
};

type FormData = typeof EMPTY_FORM;

export default function SuppliersView() {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [settings, setSettings] = useState<Settings["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("true");
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: sets }] = await Promise.all([
      supabase.from("pr_suppliers").select("*").order("name"),
      supabase.from("pr_settings").select("data").eq("id", "main").single(),
    ]);
    setSuppliers(data ?? []);
    setSettings((sets?.data as Settings["data"]) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    dialogRef.current?.showModal();
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name, type: s.type ?? "", channel: s.channel ?? "",
      website: s.website ?? "", email: s.email ?? "", phone: s.phone ?? "",
      city: s.city ?? "", province: s.province ?? "", notes: s.notes ?? "",
    });
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function f(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((d) => ({ ...d, [key]: e.target.value }));
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type || null,
      channel: (form.channel || null) as Supplier["channel"],
      website: form.website || null,
      email: form.email || null,
      phone: form.phone || null,
      city: form.city || null,
      province: form.province || null,
      notes: form.notes || null,
    };
    if (editing) {
      await supabase.from("pr_suppliers").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("pr_suppliers").insert({ ...payload, active: true });
    }
    setSaving(false);
    closeModal();
    load();
  }

  async function toggleActive(s: Supplier) {
    await supabase
      .from("pr_suppliers")
      .update({ active: !s.active })
      .eq("id", s.id);
    load();
  }

  const visible = suppliers.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.city ?? "").toLowerCase().includes(q) ||
      (s.type ?? "").toLowerCase().includes(q);
    const matchActive =
      filterActive === "" ||
      String(s.active) === filterActive;
    return matchSearch && matchActive;
  });

  return (
    <>
      <div className={tp.page}>
        {/* Header */}
        <div className={tp.header}>
          <span className={tp.heading}>
            {suppliers.length} fornecedor{suppliers.length !== 1 ? "es" : ""}
          </span>
          <button className={tp.btnPrimary} onClick={openNew}>
            <span className="material-symbols-outlined">add</span>
            Novo fornecedor
          </button>
        </div>

        {/* Controls */}
        <div className={tp.controls}>
          <div className={tp.searchWrap}>
            <span className={`${tp.searchIcon} material-symbols-outlined`}>search</span>
            <input
              className={tp.searchInput}
              placeholder="Buscar por nome, cidade ou tipo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className={tp.filterSelect}
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as typeof filterActive)}
          >
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>

        {/* Table */}
        <div className={tp.tableWrap}>
          {loading ? (
            <div className={tp.empty}>
              <span className={tp.emptyText}>Carregando…</span>
            </div>
          ) : visible.length === 0 ? (
            <div className={tp.empty}>
              <span className={`${tp.emptyIcon} material-symbols-outlined`}>storefront</span>
              <p className={tp.emptyText}>
                {search ? "Nenhum resultado" : "Nenhum fornecedor cadastrado"}
              </p>
              {!search && (
                <p className={tp.emptySub}>Clique em "Novo fornecedor" para começar.</p>
              )}
            </div>
          ) : (
            <table className={tp.table}>
              <thead>
                <tr>
                  <th className={tp.th}>Nome</th>
                  <th className={tp.th}>Tipo</th>
                  <th className={tp.th}>Canal</th>
                  <th className={tp.th}>Cidade</th>
                  <th className={tp.th}>Status</th>
                  <th className={tp.th}></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s.id} className={tp.tr}>
                    <td className={tp.td}>
                      <span className={tp.cellName}>{s.name}</span>
                      {s.website && (
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noreferrer"
                          className={tp.tdMuted}
                          style={{ display: "block", fontSize: 11, marginTop: 2 }}
                        >
                          {s.website.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>{s.type ?? "—"}</td>
                    <td className={tp.td}>
                      {s.channel ? (
                        <Badge
                          label={s.channel === "online" ? "Online" : "Físico"}
                          color={s.channel === "online" ? "blue" : "purple"}
                        />
                      ) : (
                        <span className={tp.tdMuted}>—</span>
                      )}
                    </td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>
                      {[s.city, s.province].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className={tp.td}>
                      <Badge
                        label={s.active ? "Ativo" : "Inativo"}
                        color={s.active ? "green" : "amber"}
                      />
                    </td>
                    <td className={tp.tdActions}>
                      <div className={tp.rowActions}>
                        <button
                          className={tp.btnIcon}
                          onClick={() => openEdit(s)}
                          title="Editar"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          className={tp.btnIcon}
                          onClick={() => toggleActive(s)}
                          title={s.active ? "Desativar" : "Ativar"}
                        >
                          <span className="material-symbols-outlined">
                            {s.active ? "visibility_off" : "visibility"}
                          </span>
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
      <dialog
        ref={dialogRef}
        className={m.dialog}
      >
        <div className={m.header}>
          <span className={m.title}>
            {editing ? "Editar fornecedor" : "Novo fornecedor"}
          </span>
          <button type="button" className={m.closeBtn} onClick={closeModal}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={m.body}>
          <div className={m.field}>
            <label className={m.label}>Nome *</label>
            <input className={m.input} value={form.name} onChange={f("name")} placeholder="Nome do fornecedor" />
          </div>

          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Tipo</label>
              {(settings?.dropdowns?.supplier_types ?? []).length > 0 ? (
                <select className={m.select} value={form.type} onChange={f("type")}>
                  <option value="">—</option>
                  {sortWithOutroLast(settings?.dropdowns?.supplier_types ?? []).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              ) : (
                <input className={m.input} value={form.type} onChange={f("type")} placeholder="Ex: Atacado, Varejo…" />
              )}
            </div>
            <div className={m.field}>
              <label className={m.label}>Canal</label>
              <select className={m.select} value={form.channel} onChange={f("channel")}>
                <option value="">—</option>
                <option value="online">Online</option>
                <option value="fisico">Físico</option>
              </select>
            </div>
          </div>

          <div className={m.field}>
            <label className={m.label}>Website</label>
            <input className={m.input} type="url" value={form.website} onChange={f("website")} placeholder="https://…" />
          </div>

          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Email</label>
              <input className={m.input} type="email" value={form.email} onChange={f("email")} />
            </div>
            <div className={m.field}>
              <label className={m.label}>Telefone</label>
              <input className={m.input} type="tel" value={form.phone} onChange={f("phone")} />
            </div>
          </div>

          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Cidade</label>
              <input className={m.input} value={form.city} onChange={f("city")} />
            </div>
            <div className={m.field}>
              <label className={m.label}>Província</label>
              <input className={m.input} value={form.province} onChange={f("province")} placeholder="ON" maxLength={2} />
            </div>
          </div>

          <div className={m.field}>
            <label className={m.label}>Observações</label>
            <textarea className={m.textarea} value={form.notes} onChange={f("notes")} rows={3} />
          </div>
        </div>

        <div className={m.footer}>
          <button type="button" className={m.btnCancel} onClick={closeModal}>Cancelar</button>
          <button type="button" className={m.btnSave} onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </dialog>
    </>
  );
}
