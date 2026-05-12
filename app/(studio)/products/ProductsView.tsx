"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Material, Packaging, Product, Settings } from "@/lib/types/database";
import Badge from "@/components/ui/Badge";
import tp from "@/components/ui/table-page.module.css";
import m from "@/components/ui/modal.module.css";

type MaterialOption = Pick<Material, "id" | "name" | "unit" | "unit_cost">;
type PackagingOption = Pick<Packaging, "id" | "name" | "cost">;

type IngredientRow = {
  material_id: string;
  name: string;
  unit: string;
  unit_cost: number;
  qty: string;
};

const EMPTY_FORM = {
  name: "",
  cat: "",
  mins: "",
  hourly: "",
  packaging_id: "",
  pack: "",
  ship: "",
  other: "",
  price: "",
  margin_target: "",
  notes: "",
  steps: "",
  ingredients: [] as IngredientRow[],
};
type FormData = typeof EMPTY_FORM;

function R$(n: number | null | undefined) {
  if (n == null) return "—";
  return `CA$${n.toFixed(2).replace(".", ",")}`;
}

function fmtMargin(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n.toFixed(1).replace(".", ",")}%`;
}

type Computed = {
  materialCost: number;
  laborCost: number;
  packCost: number;
  shipCost: number;
  otherCost: number;
  listingFee: number;
  transFee: number;
  paymentFee: number;
  totalCost: number;
  price: number;
  profit: number | null;
  margin: number | null;
  suggestedPrice: number | null;
};

function computeCosts(form: FormData, settings: Settings["data"] | null): Computed {
  const materialCost = form.ingredients.reduce((sum, ing) => {
    return sum + (parseFloat(ing.qty) || 0) * ing.unit_cost;
  }, 0);

  const mins = parseFloat(form.mins) || 0;
  const hourly = parseFloat(form.hourly) || settings?.hourly || 0;
  const laborCost = (mins / 60) * hourly;

  const packCost = parseFloat(form.pack) || 0;
  const shipCost = parseFloat(form.ship) || 0;
  const otherCost = parseFloat(form.other) || 0;

  const price = parseFloat(form.price) || 0;
  const listingFee = settings?.listing ?? 0;
  const transFee = price * ((settings?.trans ?? 0) / 100);
  const paymentFee = price * ((settings?.payment ?? 0) / 100);

  const totalCost = materialCost + laborCost + packCost + shipCost + otherCost + listingFee + transFee + paymentFee;
  const profit = price > 0 ? price - totalCost : null;
  const margin = price > 0 && profit != null ? (profit / price) * 100 : null;

  // Suggested price for target margin (accounting for %-based fees)
  const marginTarget = parseFloat(form.margin_target) / 100 || 0;
  const pctFees = ((settings?.trans ?? 0) + (settings?.payment ?? 0)) / 100;
  const baseCost = materialCost + laborCost + packCost + shipCost + otherCost + listingFee;
  const denominator = 1 - pctFees - marginTarget;
  const suggestedPrice = baseCost > 0 && denominator > 0.01 ? baseCost / denominator : null;

  return { materialCost, laborCost, packCost, shipCost, otherCost, listingFee, transFee, paymentFee, totalCost, price, profit, margin, suggestedPrice };
}

export default function ProductsView() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [packagings, setPackagings] = useState<PackagingOption[]>([]);
  const [settings, setSettings] = useState<Settings["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterActive, setFilterActive] = useState("active");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: mats }, { data: packs }, { data: sets }] = await Promise.all([
      supabase.from("pr_products").select("*").order("name"),
      supabase.from("pr_materials").select("id,name,unit,unit_cost").eq("active", true).order("name"),
      supabase.from("pr_packaging").select("id,name,cost").order("name"),
      supabase.from("pr_settings").select("data").eq("id", "main").single(),
    ]);
    setProducts(prods ?? []);
    setMaterials((mats ?? []) as MaterialOption[]);
    setPackagings((packs ?? []) as PackagingOption[]);
    setSettings((sets?.data as Settings["data"]) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const computed = computeCosts(form, settings);
  const productCats = settings?.dropdowns?.product_cats ?? [];

  function openNew() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      hourly: settings?.hourly?.toString() ?? "",
      pack: settings?.pack?.toString() ?? "",
      margin_target: settings?.margin?.toString() ?? "",
    });
    dialogRef.current?.showModal();
  }

  function openEdit(prod: Product) {
    setEditing(prod);
    setForm({
      name: prod.name,
      cat: prod.cat ?? "",
      mins: prod.mins?.toString() ?? "",
      hourly: prod.hourly?.toString() ?? "",
      packaging_id: "",
      pack: prod.pack?.toString() ?? "",
      ship: prod.ship?.toString() ?? "",
      other: prod.other?.toString() ?? "",
      price: prod.price?.toString() ?? "",
      margin_target: prod.margin?.toFixed(1) ?? settings?.margin?.toString() ?? "",
      notes: prod.notes ?? "",
      steps: prod.steps ?? "",
      ingredients: (prod.ingredients ?? []).map((ing) => ({
        material_id: ing.material_id,
        name: ing.name,
        unit: ing.unit,
        unit_cost: ing.unit_cost,
        qty: ing.qty.toString(),
      })),
    });
    dialogRef.current?.showModal();
  }

  function closeModal() { dialogRef.current?.close(); }

  function f(key: keyof Omit<FormData, "ingredients">) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((d) => ({ ...d, [key]: e.target.value }));
  }

  function onPackagingChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const pkg = packagings.find((p) => p.id === id);
    setForm((d) => ({
      ...d,
      packaging_id: id,
      pack: id && pkg?.cost != null ? pkg.cost.toFixed(2) : d.pack,
    }));
  }

  function addIngredient(mat: MaterialOption) {
    if (form.ingredients.some((i) => i.material_id === mat.id)) return;
    setForm((d) => ({
      ...d,
      ingredients: [
        ...d.ingredients,
        {
          material_id: mat.id,
          name: mat.name,
          unit: mat.unit ?? "un",
          unit_cost: mat.unit_cost ?? 0,
          qty: "1",
        },
      ],
    }));
  }

  function removeIngredient(id: string) {
    setForm((d) => ({ ...d, ingredients: d.ingredients.filter((i) => i.material_id !== id) }));
  }

  function setIngQty(id: string, qty: string) {
    setForm((d) => ({
      ...d,
      ingredients: d.ingredients.map((i) => i.material_id === id ? { ...i, qty } : i),
    }));
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const c = computeCosts(form, settings);
    const price = c.price || null;
    const payload = {
      name: form.name.trim(),
      cat: form.cat || null,
      price,
      mins: form.mins ? +form.mins : null,
      hourly: form.hourly ? +form.hourly : null,
      pack: form.pack ? +form.pack : null,
      ship: form.ship ? +form.ship : null,
      other: form.other ? +form.other : null,
      listing: c.listingFee,
      trans: c.transFee,
      payment: c.paymentFee,
      total_cost: c.totalCost || null,
      profit: c.profit,
      margin: c.margin,
      notes: form.notes || null,
      steps: form.steps || null,
      ingredients: form.ingredients.map((ing) => ({
        material_id: ing.material_id,
        name: ing.name,
        qty: parseFloat(ing.qty) || 0,
        unit: ing.unit,
        unit_cost: ing.unit_cost,
        total: (parseFloat(ing.qty) || 0) * ing.unit_cost,
      })),
    };
    if (editing) {
      await supabase.from("pr_products").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("pr_products").insert({ ...payload, active: true });
    }
    setSaving(false);
    closeModal();
    load();
  }

  async function toggleActive(prod: Product) {
    await supabase.from("pr_products").update({ active: !prod.active }).eq("id", prod.id);
    load();
  }

  const categories = [...new Set(products.map((p) => p.cat).filter(Boolean))] as string[];

  const visible = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.cat ?? "").toLowerCase().includes(q);
    const matchCat = !filterCat || p.cat === filterCat;
    const matchActive = filterActive === "all" || (filterActive === "active" ? p.active : !p.active);
    return matchSearch && matchCat && matchActive;
  });

  return (
    <>
      <div className={tp.page}>
        <div className={tp.header}>
          <span className={tp.heading}>
            {products.length} produto{products.length !== 1 ? "s" : ""}
          </span>
          <button className={tp.btnPrimary} onClick={openNew}>
            <span className="material-symbols-outlined">add</span>
            Novo produto
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
            <select className={tp.filterSelect} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="">Todas as categorias</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select className={tp.filterSelect} value={filterActive} onChange={(e) => setFilterActive(e.target.value)}>
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        <div className={tp.tableWrap}>
          {loading ? (
            <div className={tp.empty}><span className={tp.emptyText}>Carregando…</span></div>
          ) : visible.length === 0 ? (
            <div className={tp.empty}>
              <span className={`${tp.emptyIcon} material-symbols-outlined`}>stylus_note</span>
              <p className={tp.emptyText}>{search ? "Nenhum resultado" : "Nenhum produto cadastrado"}</p>
              {!search && <p className={tp.emptySub}>Clique em "Novo produto" para começar.</p>}
            </div>
          ) : (
            <table className={tp.table}>
              <thead>
                <tr>
                  <th className={tp.th}>Nome</th>
                  <th className={tp.th}>Categoria</th>
                  <th className={tp.th}>Preço</th>
                  <th className={tp.th}>Custo</th>
                  <th className={tp.th}>Margem</th>
                  <th className={tp.th}>Status</th>
                  <th className={tp.th}></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((prod) => (
                  <tr key={prod.id} className={tp.tr}>
                    <td className={tp.td}><span className={tp.cellName}>{prod.name}</span></td>
                    <td className={tp.td}>
                      {prod.cat
                        ? <Badge label={prod.cat} color="purple" />
                        : <span className={tp.tdMuted}>—</span>}
                    </td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>{R$(prod.price)}</td>
                    <td className={`${tp.td} ${tp.tdMuted}`}>{R$(prod.total_cost)}</td>
                    <td className={tp.td}>
                      <MarginBadge margin={prod.margin} />
                    </td>
                    <td className={tp.td}>
                      <Badge label={prod.active ? "Ativo" : "Inativo"} color={prod.active ? "green" : "amber"} />
                    </td>
                    <td className={tp.tdActions}>
                      <div className={tp.rowActions}>
                        <button className={tp.btnIcon} onClick={() => openEdit(prod)} title="Editar">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          className={tp.btnIcon}
                          onClick={() => toggleActive(prod)}
                          title={prod.active ? "Desativar" : "Ativar"}
                        >
                          <span className="material-symbols-outlined">
                            {prod.active ? "visibility_off" : "visibility"}
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
      <dialog ref={dialogRef} className={m.dialog} style={{ maxWidth: 640 }}>
        <div className={m.header}>
          <span className={m.title}>{editing ? "Editar produto" : "Novo produto"}</span>
          <button type="button" className={m.closeBtn} onClick={closeModal}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className={m.body}>
          {/* ── Informações básicas ── */}
          <div className={m.fieldRow}>
            <div className={m.field} style={{ flex: 2 }}>
              <label className={m.label}>Nome *</label>
              <input className={m.input} value={form.name} onChange={f("name")} placeholder="Nome do produto" />
            </div>
            <div className={m.field}>
              <label className={m.label}>Categoria</label>
              {productCats.length > 0 ? (
                <select className={m.select} value={form.cat} onChange={f("cat")}>
                  <option value="">—</option>
                  {productCats.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input className={m.input} value={form.cat} onChange={f("cat")} placeholder="Categoria" />
              )}
            </div>
          </div>

          {/* ── Ingredientes ── */}
          <div className={m.sectionTitle}>Ingredientes / Materiais</div>

          {form.ingredients.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {form.ingredients.map((ing) => {
                const total = (parseFloat(ing.qty) || 0) * ing.unit_cost;
                return (
                  <div
                    key={ing.material_id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto 26px",
                      gap: 8,
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "var(--rs-color-background-secondary)",
                      borderRadius: "var(--radius-xs)",
                      border: "1px solid var(--rs-color-border-neutral)",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ing.name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={ing.qty}
                        onChange={(e) => setIngQty(ing.material_id, e.target.value)}
                        style={{
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
                        }}
                      />
                      <span style={{ fontSize: 12, color: "var(--rs-color-foreground-disabled)", minWidth: 22 }}>
                        {ing.unit}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--rs-color-foreground-muted)", minWidth: 68, textAlign: "right" }}>
                      {R$(total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeIngredient(ing.material_id)}
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
          <MatPickerSection
            materials={materials}
            ingredients={form.ingredients}
            onAdd={addIngredient}
          />

          {/* ── Custos de produção ── */}
          <div className={m.sectionTitle}>Custos de produção</div>
          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Tempo (minutos)</label>
              <input className={m.input} type="number" min={0} step="any" value={form.mins} onChange={f("mins")} placeholder="0" />
            </div>
            <div className={m.field}>
              <label className={m.label}>CA$/hora</label>
              <input
                className={m.input}
                type="number"
                min={0}
                step="any"
                value={form.hourly}
                onChange={f("hourly")}
                placeholder={settings?.hourly?.toString() ?? "0"}
              />
            </div>
          </div>
          <div className={m.fieldRow}>
            {packagings.length > 0 && (
              <div className={m.field}>
                <label className={m.label}>Embalagem</label>
                <select className={m.select} value={form.packaging_id} onChange={onPackagingChange}>
                  <option value="">Personalizado</option>
                  {packagings.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.cost != null ? ` — CA$${p.cost.toFixed(2)}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className={m.field}>
              <label className={m.label}>Custo embalagem (CA$)</label>
              <input
                className={m.input}
                type="number"
                min={0}
                step="any"
                value={form.pack}
                onChange={f("pack")}
                readOnly={!!form.packaging_id}
                style={form.packaging_id ? { background: "var(--rs-color-background-tertiary)", cursor: "default" } : {}}
                placeholder={settings?.pack?.toString() ?? "0"}
              />
            </div>
          </div>
          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Envio (CA$)</label>
              <input className={m.input} type="number" min={0} step="any" value={form.ship} onChange={f("ship")} placeholder="0" />
            </div>
          </div>
          <div className={m.field}>
            <label className={m.label}>Outros custos (CA$)</label>
            <input className={m.input} type="number" min={0} step="any" value={form.other} onChange={f("other")} placeholder="0" />
          </div>

          {/* ── Preço e lucro ── */}
          <div className={m.sectionTitle}>Preço e lucro</div>
          <div className={m.fieldRow}>
            <div className={m.field}>
              <label className={m.label}>Margem desejada (%)</label>
              <input
                className={m.input}
                type="number"
                min={0}
                max={99}
                step="any"
                value={form.margin_target}
                onChange={f("margin_target")}
                placeholder={settings?.margin?.toString() ?? "30"}
              />
            </div>
            <div className={m.field}>
              <label className={m.label}>Preço sugerido (CA$)</label>
              <input
                className={m.input}
                readOnly
                value={computed.suggestedPrice != null ? computed.suggestedPrice.toFixed(2) : "—"}
                style={{ background: "var(--rs-color-background-tertiary)", cursor: "default" }}
              />
            </div>
          </div>
          <div className={m.field}>
            <label className={m.label}>Preço de venda (CA$)</label>
            <input className={m.input} type="number" min={0} step="any" value={form.price} onChange={f("price")} placeholder="0,00" />
          </div>

          <CostBreakdown computed={computed} settings={settings} />

          {/* ── Receita e observações ── */}
          <div className={m.sectionTitle}>Receita e observações</div>
          <div className={m.field}>
            <label className={m.label}>Passo a passo</label>
            <textarea
              className={m.textarea}
              rows={3}
              value={form.steps}
              onChange={f("steps")}
              placeholder="Descreva o processo de produção…"
            />
          </div>
          <div className={m.field}>
            <label className={m.label}>Observações</label>
            <textarea className={m.textarea} rows={2} value={form.notes} onChange={f("notes")} />
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

// ── Sub-components ────────────────────────────────────────────────────────────

function MatPickerSection({
  materials,
  ingredients,
  onAdd,
}: {
  materials: MaterialOption[];
  ingredients: IngredientRow[];
  onAdd: (mat: MaterialOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = materials.filter(
    (mat) =>
      !ingredients.some((i) => i.material_id === mat.id) &&
      (!search || mat.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {!open ? (
        <button type="button" className={tp.btnGhost} onClick={() => setOpen(true)}>
          <span className="material-symbols-outlined">add</span>
          Adicionar material
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
              placeholder="Buscar material…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 16px", fontSize: 13, color: "var(--rs-color-foreground-disabled)" }}>
                {search ? "Nenhum material encontrado" : "Todos os materiais ativos já foram adicionados"}
              </div>
            ) : (
              filtered.map((mat) => <MatPickerRow key={mat.id} mat={mat} onAdd={(m) => { onAdd(m); setOpen(false); setSearch(""); }} />)
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

function MatPickerRow({ mat, onAdd }: { mat: MaterialOption; onAdd: (m: MaterialOption) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
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
        {mat.unit_cost != null
          ? `CA$${mat.unit_cost.toFixed(2).replace(".", ",")}/${mat.unit ?? "un"}`
          : "sem custo"}
      </span>
    </button>
  );
}

function CostBreakdown({
  computed,
  settings,
}: {
  computed: Computed;
  settings: Settings["data"] | null;
}) {
  const { materialCost, laborCost, packCost, shipCost, otherCost, listingFee, transFee, paymentFee, totalCost, profit, margin } = computed;

  const rows = [
    { label: "Materiais", value: materialCost },
    { label: "Mão de obra", value: laborCost },
    { label: "Embalagem", value: packCost },
    { label: "Envio", value: shipCost },
    { label: "Outros", value: otherCost },
    { label: `Listing (CA$ fixo)`, value: listingFee },
    { label: `Transação (${settings?.trans ?? 0}%)`, value: transFee },
    { label: `Pagamento (${settings?.payment ?? 0}%)`, value: paymentFee },
  ].filter((r) => r.value > 0);

  const profitColor = profit == null ? "#6b7280" : profit >= 0 ? "#16a34a" : "#dc2626";
  const marginColor =
    margin == null ? "#6b7280" : margin >= 30 ? "#16a34a" : margin >= 10 ? "#d97706" : "#dc2626";

  return (
    <div style={{
      border: "1px solid var(--rs-color-border-neutral)",
      borderRadius: "var(--radius-xs)",
      overflow: "hidden",
      fontSize: 13,
    }}>
      {rows.length === 0 ? (
        <div style={{
          padding: "10px 12px",
          color: "var(--rs-color-foreground-disabled)",
          fontSize: 12,
        }}>
          Preencha os campos acima para ver o detalhamento de custos.
        </div>
      ) : (
        rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "7px 12px",
              borderBottom: "1px solid var(--rs-color-border-neutral)",
              color: "var(--rs-color-foreground-muted)",
            }}
          >
            <span>{row.label}</span>
            <span>CA${row.value.toFixed(2).replace(".", ",")}</span>
          </div>
        ))
      )}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 12px",
        fontWeight: 600,
        color: "var(--rs-color-foreground-neutral)",
        borderBottom: "1px solid var(--rs-color-border-neutral)",
        background: "var(--rs-color-background-secondary)",
      }}>
        <span>Custo total</span>
        <span>CA${totalCost.toFixed(2).replace(".", ",")}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{
          padding: "10px 12px",
          borderRight: "1px solid var(--rs-color-border-neutral)",
        }}>
          <div style={{ fontSize: 11, color: "var(--rs-color-foreground-disabled)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Lucro
          </div>
          <div style={{ fontWeight: 700, color: profitColor }}>
            {profit != null ? `CA$${profit.toFixed(2).replace(".", ",")}` : "—"}
          </div>
        </div>
        <div style={{ padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--rs-color-foreground-disabled)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Margem
          </div>
          <div style={{ fontWeight: 700, color: marginColor }}>
            {margin != null ? `${margin.toFixed(1).replace(".", ",")}%` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function MarginBadge({ margin }: { margin: number | null }) {
  if (margin == null) return <span style={{ color: "var(--rs-color-foreground-disabled)", fontSize: 13 }}>—</span>;
  const color = margin >= 30 ? "#16a34a" : margin >= 10 ? "#d97706" : "#dc2626";
  return (
    <span style={{ fontSize: 13, fontWeight: 600, color }}>
      {margin.toFixed(1).replace(".", ",")}%
    </span>
  );
}
