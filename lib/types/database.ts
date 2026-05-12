// ─── Shared primitives ───────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  type: string | null;
  channel: "online" | "fisico" | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  notes: string | null;
  active: boolean;
  updated_at: string;
}

export interface Material {
  id: string;
  name: string;
  cat: string | null;
  supplier_ids: string[];
  price: number | null;
  qty: number | null;
  unit: string | null;
  unit_cost: number | null;
  notes: string | null;
  active: boolean;
  updated_at: string;
}

export interface Packaging {
  id: string;
  name: string;
  type: string | null;
  dims: string | null;
  cost: number | null;
  supplier_id: string | null;
  color: string | null;
  notes: string | null;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  channel: string | null;
  city: string | null;
  notes: string | null;
  active: boolean;
  updated_at: string;
}

export interface ProductIngredient {
  material_id: string;
  name: string;
  qty: number;
  unit: string;
  unit_cost: number;
  total: number;
}

export interface Product {
  id: string;
  name: string;
  cat: string | null;
  price: number | null;
  profit: number | null;
  total_cost: number | null;
  margin: number | null;
  mins: number | null;
  hourly: number | null;
  pack: number | null;
  ship: number | null;
  other: number | null;
  listing: number | null;
  trans: number | null;
  payment: number | null;
  notes: string | null;
  steps: string | null;
  ingredients: ProductIngredient[];
  active: boolean;
  variant_of: string | null;
  saved_at: string | null;
  updated_at: string;
}

export interface PurchaseItem {
  material_id: string;
  name: string;
  qty: number;
  unit: string;
  unit_price: number;
  total: number;
}

export type PurchaseStatus = "planejada" | "feita" | "recebida";

export interface Purchase {
  id: string;
  date: string | null;
  supplier_id: string | null;
  items: PurchaseItem[];
  shipping: number;
  total: number | null;
  cat: string | null;
  payment_method: string | null;
  status: PurchaseStatus;
  notes: string | null;
  updated_at: string;
}

export interface InventoryAdjustmentItem {
  material_id: string;
  name: string;
  qty_before: number;
  qty_after: number;
  unit: string;
}

export interface InventoryAdjustment {
  id: string;
  date: string | null;
  mode: string | null;
  reason: string | null;
  notes: string | null;
  items: InventoryAdjustmentItem[];
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  qty: number;
  price: number;
  total: number;
}

export type OrderStatus =
  | "novo"
  | "producao"
  | "pronto"
  | "enviado"
  | "entregue"
  | "cancelado";

export interface Order {
  id: string;
  date: string | null;
  due_date: string | null;
  client_id: string | null;
  client_name: string | null;
  origin: string | null;
  status: OrderStatus;
  items: OrderItem[];
  shipping_type: string | null;
  ship_date: string | null;
  tracking: string | null;
  total: number | null;
  notes: string | null;
  updated_at: string;
}

export interface QuoteItem {
  product_id: string | null;
  name: string;
  qty: number;
  price: number;
  total: number;
}

export type QuoteStatus = "orcamento" | "aprovado" | "recusado" | "expirado" | "convertido";

export interface Quote {
  id: string;
  date: string | null;
  expiry: string | null;
  client_id: string | null;
  client_name: string | null;
  items: QuoteItem[];
  discount: number;
  total: number | null;
  message: string | null;
  status: QuoteStatus;
  updated_at: string;
}

export interface SettingsDropdowns {
  material_cats: string[];
  supplier_types: string[];
  product_cats: string[];
  client_channels: string[];
  payment_methods: string[];
}

export interface SettingsData {
  hourly: number;
  pack: number;
  margin: number;
  quote_validity_days: number;
  listing: number;
  trans: number;
  payment: number;
  dropdowns: SettingsDropdowns;
}

export interface Settings {
  id: "main";
  data: SettingsData;
  updated_at: string;
}

// ─── Database schema type (for Supabase client) ───────────────────────────────

export interface Database {
  public: {
    Tables: {
      pr_suppliers: {
        Row: Supplier;
        Insert: Omit<Supplier, "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<Omit<Supplier, "id">>;
      };
      pr_materials: {
        Row: Material;
        Insert: Omit<Material, "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<Omit<Material, "id">>;
      };
      pr_packaging: {
        Row: Packaging;
        Insert: Omit<Packaging, "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<Omit<Packaging, "id">>;
      };
      pr_clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<Omit<Client, "id">>;
      };
      pr_products: {
        Row: Product;
        Insert: Omit<Product, "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<Omit<Product, "id">>;
      };
      pr_purchases: {
        Row: Purchase;
        Insert: Omit<Purchase, "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<Omit<Purchase, "id">>;
      };
      pr_inventory_adjustments: {
        Row: InventoryAdjustment;
        Insert: Omit<InventoryAdjustment, "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<Omit<InventoryAdjustment, "id">>;
      };
      pr_orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<Omit<Order, "id">>;
      };
      pr_quotes: {
        Row: Quote;
        Insert: Omit<Quote, "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<Omit<Quote, "id">>;
      };
      pr_settings: {
        Row: Settings;
        Insert: Omit<Settings, "updated_at"> & { updated_at?: string };
        Update: Partial<Omit<Settings, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
