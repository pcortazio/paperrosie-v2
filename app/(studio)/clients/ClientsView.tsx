"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Client, Settings } from "@/lib/types/database";
import Badge from "@/components/ui/Badge";
import tp from "@/components/ui/table-page.module.css";
import m from "@/components/ui/modal.module.css";

const EMPTY_FORM = { name: "", email: "", channel: "", city: "", notes: "" };
type FormData = typeof EMPTY_FORM;

export default function ClientsView() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<Settings["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("true");
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: sets }] = await Promise.all([
      supabase.from("pr_clients").select("*").order("name"),
      supabase.from("pr_settings").select("data").eq("id", "main").single(),
    ]);
    setClients(data ?? []);
    setSettings((sets?.data as Settings["data"]) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    dialogRef.current?.showModal();
  }

  function openEdit(c: Client) {
    setEditing(c);
    setForm({
      name: c.name, email: c.email ?? "", channel: c.channel ?? "",
      city: c.city ?? "", notes: c.notes ?? "",
    });
    dialogRef.current?.showModal();
  }

  function closeModal() { dialogRef.current?.close(); }

  function f(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((d) => ({ ...d, [key]: e.target.value }));
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email || null,
      channel: form.channel || null,
      city: form.city || null,
      notes: form.notes || null,
    };
    if (editing) {
      await supabase.from("pr_clients").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("pr_clients").insert({ ...payload, active: true });
    }
    setSaving(false);
    closeModal();
    load();
  }

  async function toggleActive(c: Client) {
    await supabase.from("pr_clients").update({ active: !c.active }).eq("id", c.id);
    load();
  }

  const visible = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.city ?? "").toLowerCase().includes(q);
    const matchActive = filterActive === "" || String(c.active) === filterActive;
    return matchSearch && matchActive;
  });

  return (
    <>
      <div className={tp.page}>
        <div className={tp.header}>
          <span className={tp.heading}>
            {clients.length} cliente{clients.length !== 1 ? "s" : ""}
          </span>
          <button className={tp.btnPrimary} onClick={openNew}>
            <span className="material-symbols-outlined">add</span>
            Novo cliente
          </button>
        </div>

        <div className={tp.controls}>
          <div className={tp.searchWrap}>
            <span className={`${tp.searchIcon} material-symbols-outlined`}>search</span>
            <input
              className={tp.searchInput}
              placeholder="Buscar por nome, email ou cidade…"
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

        <div className={tp.tableWrap}>
          {loading ? (
            <div className={tp.empty}><span className={tp.emptyText}>Carregando…</span></div>
          ) : visible.length === 0 ? (
            <div className={tp.empty}>
              <span className={`${tp.emptyIcon} material-symbols-outlined`}>group</span>
              <p className={tp.emptyText}>{search ? "Nenhum resultado" : "Nenhum cliente cadastrado"}</p>
              {!search && <p className={tp.emptySub}>Clique em "Novo cliente" para começar.</p>}
            </div>
          ) : (
            <table className={tp.table}>
              <thead>
                <tr>
                  <th className={tp.th}>Nome</th>
                  <th className={tp.th}>Email</th>
                  <th className={tp.th}>Canal</th>
                  <th className={tp.th}>Cidade</th>
                  <th className={tp.th}>Status</th>
                  <th className={tp.th}></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id} className={tp.tr}>
                    <td className={tp.td}><span className={tp.cellName}>{c.name}</span></td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>{c.email ?? "—"}</td>
                    <td className={tp.td}>
                      {c.channel
                        ? <Badge label={c.channel} color="blue" />
                        : <span className={tp.tdMuted}>—</span>}
                    </td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>{c.city ?? "—"}</td>
                    <td className={tp.td}>
                      <Badge label={c.active ? "Ativo" : "Inativo"} color={c.active ? "green" : "amber"} />
                    </td>
                    <td className={tp.tdActions}>
                      <div className={tp.rowActions}>
                        <button className={tp.btnIcon} onClick={() => openEdit(c)} title="Editar">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className={tp.btnIcon} onClick={() => toggleActive(c)} title={c.active ? "Desativar" : "Ativar"}>
                          <span className="material-symbols-outlined">{c.active ? "visibility_off" : "visibility"}</span>
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
          <span className={m.title}>{editing ? "Editar cliente" : "Novo cliente"}</span>
          <button type="button" className={m.closeBtn} onClick={closeModal}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className={m.body}>
          <div className={m.field}>
            <label className={m.label}>Nome *</label>
            <input className={m.input} value={form.name} onChange={f("name")} placeholder="Nome do cliente" />
          </div>
          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Email</label>
              <input className={m.input} type="email" value={form.email} onChange={f("email")} />
            </div>
            <div className={m.field}>
              <label className={m.label}>Canal de origem</label>
              {(settings?.dropdowns?.client_channels ?? []).length > 0 ? (
                <select className={m.select} value={form.channel} onChange={f("channel")}>
                  <option value="">—</option>
                  {(settings?.dropdowns?.client_channels ?? []).map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              ) : (
                <input className={m.input} value={form.channel} onChange={f("channel")} placeholder="Ex: Etsy, Instagram…" />
              )}
            </div>
          </div>
          <div className={m.field}>
            <label className={m.label}>Cidade</label>
            <input className={m.input} value={form.city} onChange={f("city")} />
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
