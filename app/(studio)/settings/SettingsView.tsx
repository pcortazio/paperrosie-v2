"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SettingsData } from "@/lib/types/database";
import styles from "./settings.module.css";

const DEFAULT_SETTINGS: SettingsData = {
  hourly: 25,
  pack: 2,
  margin: 30,
  quote_validity_days: 30,
  listing: 0.2,
  trans: 6.5,
  payment: 3,
  dropdowns: {
    material_cats: ["Papel", "Tecido", "Fio", "Tinta", "Cola", "Metal", "Plástico", "Outro"],
    supplier_types: ["Atacado", "Varejo", "Importado", "Artesanal", "Outro"],
    product_cats: ["Caderno", "Agenda", "Bloco", "Acessório", "Kit", "Outro"],
    client_channels: ["Etsy", "Instagram", "Whatsapp", "Indicação", "Loja", "Outro"],
    payment_methods: ["Pix", "Cartão", "Boleto", "Dinheiro", "Transferência"],
    shipping_methods: ["Correios PAC", "Correios SEDEX", "Motoboy", "Retirada", "Outro"],
  },
};

function EditableList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (v && !items.includes(v)) {
      onChange([...items, v]);
      setDraft("");
    }
  }

  function remove(item: string) {
    onChange(items.filter((i) => i !== item));
  }

  return (
    <div className={styles.listBlock}>
      <span className={styles.listLabel}>{label}</span>
      <div className={styles.tags}>
        {items.map((item) => (
          <span key={item} className={styles.tag}>
            {item}
            <button
              type="button"
              className={styles.tagRemove}
              onClick={() => remove(item)}
              aria-label={`Remover ${item}`}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </span>
        ))}
      </div>
      <div className={styles.addRow}>
        <input
          type="text"
          className={styles.addInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nova opção…"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <button type="button" className={styles.addBtn} onClick={add}>
          Adicionar
        </button>
      </div>
    </div>
  );
}

export default function SettingsView() {
  const supabase = createClient();
  const [data, setData] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const { data: row } = await supabase
      .from("pr_settings")
      .select("data")
      .eq("id", "main")
      .single();

    if (row?.data && Object.keys(row.data).length > 0) {
      setData({ ...DEFAULT_SETTINGS, ...(row.data as SettingsData) });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  function set<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function setDropdown(key: keyof SettingsData["dropdowns"], value: string[]) {
    setData((d) => ({
      ...d,
      dropdowns: { ...d.dropdowns, [key]: value },
    }));
  }

  async function save() {
    setSaving(true);
    await supabase.from("pr_settings").upsert({ id: "main", data });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <div className={styles.loading}>Carregando…</div>;

  return (
    <div className={styles.page}>
      {/* Precificação */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Precificação padrão</h2>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>Hora de trabalho (CA$)</label>
            <input
              type="number"
              className={styles.input}
              value={data.hourly}
              onChange={(e) => set("hourly", +e.target.value)}
              min={0}
              step={0.5}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Embalagem padrão (CA$)</label>
            <input
              type="number"
              className={styles.input}
              value={data.pack}
              onChange={(e) => set("pack", +e.target.value)}
              min={0}
              step={0.5}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Margem padrão (%)</label>
            <input
              type="number"
              className={styles.input}
              value={data.margin}
              onChange={(e) => set("margin", +e.target.value)}
              min={0}
              max={100}
              step={1}
            />
          </div>
        </div>
      </section>

      {/* Taxas Etsy */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Taxas Etsy</h2>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>Listing (CA$)</label>
            <input
              type="number"
              className={styles.input}
              value={data.listing}
              onChange={(e) => set("listing", +e.target.value)}
              min={0}
              step={0.01}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Transação (%)</label>
            <input
              type="number"
              className={styles.input}
              value={data.trans}
              onChange={(e) => set("trans", +e.target.value)}
              min={0}
              max={100}
              step={0.1}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Pagamento (%)</label>
            <input
              type="number"
              className={styles.input}
              value={data.payment}
              onChange={(e) => set("payment", +e.target.value)}
              min={0}
              max={100}
              step={0.1}
            />
          </div>
        </div>
      </section>

      {/* Orçamentos */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Orçamentos</h2>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>Validade padrão (dias)</label>
            <input
              type="number"
              className={styles.input}
              value={data.quote_validity_days}
              onChange={(e) => set("quote_validity_days", +e.target.value)}
              min={1}
              step={1}
            />
          </div>
        </div>
      </section>

      {/* Dropdowns */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Listas de opções</h2>
        <div className={styles.dropdownGrid}>
          <EditableList
            label="Categorias de material"
            items={data.dropdowns.material_cats}
            onChange={(v) => setDropdown("material_cats", v)}
          />
          <EditableList
            label="Tipos de fornecedor"
            items={data.dropdowns.supplier_types}
            onChange={(v) => setDropdown("supplier_types", v)}
          />
          <EditableList
            label="Categorias de produto"
            items={data.dropdowns.product_cats}
            onChange={(v) => setDropdown("product_cats", v)}
          />
          <EditableList
            label="Canais de cliente"
            items={data.dropdowns.client_channels}
            onChange={(v) => setDropdown("client_channels", v)}
          />
          <EditableList
            label="Formas de pagamento"
            items={data.dropdowns.payment_methods}
            onChange={(v) => setDropdown("payment_methods", v)}
          />
          <EditableList
            label="Formas de envio"
            items={data.dropdowns.shipping_methods ?? []}
            onChange={(v) => setDropdown("shipping_methods", v)}
          />
        </div>
      </section>

      {/* Save */}
      <div className={styles.saveRow}>
        {saved && (
          <span className={styles.savedMsg}>
            <span className="material-symbols-outlined">check_circle</span>
            Salvo com sucesso
          </span>
        )}
        <button
          type="button"
          className={styles.btnSave}
          onClick={save}
          disabled={saving}
        >
          {saving ? "Salvando…" : "Salvar configurações"}
        </button>
      </div>
    </div>
  );
}
