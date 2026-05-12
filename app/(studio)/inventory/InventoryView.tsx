"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { InventoryAdjustment, Material } from "@/lib/types/database";
import Badge from "@/components/ui/Badge";
import tp from "@/components/ui/table-page.module.css";
import m from "@/components/ui/modal.module.css";

type MaterialOption = Pick<Material, "id" | "name" | "unit" | "qty">;

type AdjItemRow = {
  material_id: string;
  name: string;
  unit: string;
  qty_before: number;
  qty_after: string;
};

const MODES = ["entrada", "saída", "contagem", "perda", "ajuste"] as const;
type Mode = (typeof MODES)[number];

const MODE_LABELS: Record<Mode, string> = {
  entrada: "Entrada",
  saída: "Saída",
  contagem: "Contagem",
  perda: "Perda",
  ajuste: "Ajuste",
};

const MODE_COLORS: Record<Mode, "green" | "amber" | "blue" | "gray" | "purple"> = {
  entrada: "green",
  saída: "amber",
  contagem: "blue",
  perda: "gray",
  ajuste: "purple",
};

function modeLabel(mode: string | null) {
  return mode && mode in MODE_LABELS ? MODE_LABELS[mode as Mode] : mode ?? "—";
}

function modeBadgeColor(mode: string | null) {
  return mode && mode in MODE_COLORS ? MODE_COLORS[mode as Mode] : "gray";
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, mo, day] = d.split("-");
  return `${day}/${mo}/${y}`;
}

function fmtQty(n: number, unit: string) {
  return `${n} ${unit}`.trim();
}

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  mode: "ajuste" as Mode,
  reason: "",
  notes: "",
  items: [] as AdjItemRow[],
};
type FormData = typeof EMPTY_FORM;

export default function InventoryView() {
  const supabase = createClient();
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("");
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<InventoryAdjustment | null>(null);
  const [matSearch, setMatSearch] = useState("");
  const [showMatPicker, setShowMatPicker] = useState(false);
  const newDialogRef = useRef<HTMLDialogElement>(null);
  const viewDialogRef = useRef<HTMLDialogElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: adjs }, { data: mats }] = await Promise.all([
      supabase.from("pr_inventory_adjustments").select("*").order("date", { ascending: false }),
      supabase.from("pr_materials").select("id,name,unit,qty").eq("active", true).order("name"),
    ]);
    setAdjustments(adjs ?? []);
    setMaterials(mats ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) });
    setMatSearch("");
    setShowMatPicker(false);
    newDialogRef.current?.showModal();
  }

  function openView(adj: InventoryAdjustment) {
    setViewing(adj);
    viewDialogRef.current?.showModal();
  }

  function closeNew() { newDialogRef.current?.close(); }
  function closeView() { viewDialogRef.current?.close(); }

  function f(key: keyof Omit<FormData, "items">) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((d) => ({ ...d, [key]: e.target.value }));
  }

  function addMaterial(mat: MaterialOption) {
    if (form.items.some((i) => i.material_id === mat.id)) return;
    setForm((d) => ({
      ...d,
      items: [
        ...d.items,
        {
          material_id: mat.id,
          name: mat.name,
          unit: mat.unit ?? "un",
          qty_before: mat.qty ?? 0,
          qty_after: (mat.qty ?? 0).toString(),
        },
      ],
    }));
    setMatSearch("");
    setShowMatPicker(false);
  }

  function removeItem(id: string) {
    setForm((d) => ({ ...d, items: d.items.filter((i) => i.material_id !== id) }));
  }

  function setQtyAfter(id: string, value: string) {
    setForm((d) => ({
      ...d,
      items: d.items.map((i) => i.material_id === id ? { ...i, qty_after: value } : i),
    }));
  }

  async function save() {
    if (form.items.length === 0) return;
    setSaving(true);

    const items = form.items.map((i) => ({
      material_id: i.material_id,
      name: i.name,
      unit: i.unit,
      qty_before: i.qty_before,
      qty_after: Math.round((parseFloat(i.qty_after) || 0) * 100) / 100,
    }));

    await supabase.from("pr_inventory_adjustments").insert({
      date: form.date || null,
      mode: form.mode,
      reason: form.reason || null,
      notes: form.notes || null,
      items,
    });

    // Update each material's qty
    await Promise.all(
      items.map((i) =>
        supabase.from("pr_materials").update({ qty: i.qty_after }).eq("id", i.material_id)
      )
    );

    setSaving(false);
    closeNew();
    load();
  }

  const filteredMats = materials.filter(
    (mat) =>
      !form.items.some((i) => i.material_id === mat.id) &&
      (!matSearch || mat.name.toLowerCase().includes(matSearch.toLowerCase()))
  );

  const visible = adjustments.filter(
    (a) => !filterMode || a.mode === filterMode
  );

  return (
    <>
      <div className={tp.page}>
        <div className={tp.header}>
          <span className={tp.heading}>
            {adjustments.length} ajuste{adjustments.length !== 1 ? "s" : ""}
          </span>
          <button className={tp.btnPrimary} onClick={openNew}>
            <span className="material-symbols-outlined">add</span>
            Novo ajuste
          </button>
        </div>

        <div className={tp.controls}>
          <select className={tp.filterSelect} value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
            <option value="">Todos os tipos</option>
            {MODES.map((mo) => (
              <option key={mo} value={mo}>{MODE_LABELS[mo]}</option>
            ))}
          </select>
        </div>

        <div className={tp.tableWrap}>
          {loading ? (
            <div className={tp.empty}><span className={tp.emptyText}>Carregando…</span></div>
          ) : visible.length === 0 ? (
            <div className={tp.empty}>
              <span className={`${tp.emptyIcon} material-symbols-outlined`}>monitoring</span>
              <p className={tp.emptyText}>{filterMode ? "Nenhum resultado" : "Nenhum ajuste registrado"}</p>
              {!filterMode && <p className={tp.emptySub}>Clique em "Novo ajuste" para registrar uma movimentação.</p>}
            </div>
          ) : (
            <table className={tp.table}>
              <thead>
                <tr>
                  <th className={tp.th}>Data</th>
                  <th className={tp.th}>Tipo</th>
                  <th className={tp.th}>Motivo</th>
                  <th className={tp.th}>Materiais</th>
                  <th className={tp.th}></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((adj) => (
                  <tr key={adj.id} className={tp.tr}>
                    <td className={`${tp.td} ${tp.tdMuted}`}>{fmtDate(adj.date)}</td>
                    <td className={tp.td}>
                      <Badge label={modeLabel(adj.mode)} color={modeBadgeColor(adj.mode)} />
                    </td>
                    <td className={`${tp.td} ${tp.tdMuted}`} style={{ maxWidth: 240 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {adj.reason ?? "—"}
                      </span>
                    </td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>
                      {(adj.items ?? []).length} {(adj.items ?? []).length === 1 ? "material" : "materiais"}
                    </td>
                    <td className={tp.tdActions}>
                      <div className={tp.rowActions}>
                        <button className={tp.btnIcon} onClick={() => openView(adj)} title="Ver detalhes">
                          <span className="material-symbols-outlined">open_in_new</span>
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

      {/* ── Modal novo ajuste ── */}
      <dialog ref={newDialogRef} className={m.dialog} style={{ maxWidth: 580 }}>
        <div className={m.header}>
          <span className={m.title}>Novo ajuste de estoque</span>
          <button className={m.closeBtn} onClick={closeNew}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={m.body}>
          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Data</label>
              <input className={m.input} type="date" value={form.date} onChange={f("date")} />
            </div>
            <div className={m.field}>
              <label className={m.label}>Tipo</label>
              <select className={m.select} value={form.mode} onChange={f("mode")}>
                {MODES.map((mo) => (
                  <option key={mo} value={mo}>{MODE_LABELS[mo]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={m.field}>
            <label className={m.label}>Motivo</label>
            <input
              className={m.input}
              value={form.reason}
              onChange={f("reason")}
              placeholder="Ex: Recebimento de compra, uso em produção…"
            />
          </div>

          {/* ── Materiais ── */}
          <div className={m.sectionTitle}>Materiais ajustados *</div>

          {form.items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 90px 60px 26px",
                gap: 8,
                padding: "0 12px",
              }}>
                {["Material", "Antes", "Depois", "Diff", ""].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rs-color-foreground-disabled)" }}>
                    {h}
                  </span>
                ))}
              </div>

              {form.items.map((item) => {
                const after = parseFloat(item.qty_after) || 0;
                const diff = after - item.qty_before;
                const diffColor = diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "var(--rs-color-foreground-disabled)";
                return (
                  <div
                    key={item.material_id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 90px 90px 60px 26px",
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
                    <span style={{ fontSize: 13, color: "var(--rs-color-foreground-muted)" }}>
                      {fmtQty(item.qty_before, item.unit)}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={item.qty_after}
                        onChange={(e) => setQtyAfter(item.material_id, e.target.value)}
                        style={{
                          width: "100%",
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
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: diffColor, textAlign: "right" }}>
                      {diff === 0 ? "—" : `${diff > 0 ? "+" : ""}${diff}`}
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
                );
              })}
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
                    <MatPickerRow key={mat.id} mat={mat} onAdd={addMaterial} />
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

          <div className={m.field}>
            <label className={m.label}>Observações</label>
            <textarea className={m.textarea} rows={2} value={form.notes} onChange={f("notes")} />
          </div>
        </div>

        <div className={m.footer}>
          <button className={m.btnCancel} onClick={closeNew}>Cancelar</button>
          <button className={m.btnSave} onClick={save} disabled={saving || form.items.length === 0}>
            {saving ? "Salvando…" : "Salvar e atualizar estoque"}
          </button>
        </div>
      </dialog>

      {/* ── Modal visualizar ajuste ── */}
      <dialog ref={viewDialogRef} className={m.dialog} style={{ maxWidth: 520 }}>
        {viewing && (
          <>
            <div className={m.header}>
              <div style={{ flex: 1 }}>
                <span className={m.title}>Ajuste de estoque</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <Badge label={modeLabel(viewing.mode)} color={modeBadgeColor(viewing.mode)} />
                  <span style={{ fontSize: 12, color: "var(--rs-color-foreground-muted)" }}>{fmtDate(viewing.date)}</span>
                </div>
              </div>
              <button className={m.closeBtn} onClick={closeView}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className={m.body}>
              {viewing.reason && (
                <div className={m.field}>
                  <label className={m.label}>Motivo</label>
                  <p style={{ fontSize: 13, color: "var(--rs-color-foreground-neutral)", margin: 0 }}>{viewing.reason}</p>
                </div>
              )}

              <div className={m.sectionTitle}>Materiais</div>

              {/* Header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 80px 60px",
                gap: 8,
                padding: "0 12px 4px",
              }}>
                {["Material", "Antes", "Depois", "Diff"].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rs-color-foreground-disabled)" }}>
                    {h}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {(viewing.items ?? []).map((item) => {
                  const diff = item.qty_after - item.qty_before;
                  const diffColor = diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "var(--rs-color-foreground-disabled)";
                  return (
                    <div
                      key={item.material_id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 80px 80px 60px",
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
                      <span style={{ fontSize: 13, color: "var(--rs-color-foreground-muted)" }}>
                        {fmtQty(item.qty_before, item.unit)}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--rs-color-foreground-neutral)", fontWeight: 500 }}>
                        {fmtQty(item.qty_after, item.unit)}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: diffColor }}>
                        {diff === 0 ? "—" : `${diff > 0 ? "+" : ""}${diff}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {viewing.notes && (
                <div className={m.field}>
                  <label className={m.label}>Observações</label>
                  <p style={{ fontSize: 13, color: "var(--rs-color-foreground-muted)", margin: 0 }}>{viewing.notes}</p>
                </div>
              )}
            </div>
            <div className={m.footer}>
              <button className={m.btnSave} onClick={closeView}>Fechar</button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
      <span style={{ fontSize: 12, color: "var(--rs-color-foreground-disabled)" }}>
        estoque: {mat.qty ?? 0} {mat.unit ?? "un"}
      </span>
    </button>
  );
}
