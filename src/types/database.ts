export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type UUID = string;
type Timestamp = string;
type DateString = string;
type Numeric = number;

type Pr2Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type Pr2Enums = {
  pr2_purchase_status: "ordered" | "received" | "cancelled";
  pr2_quote_status: "draft" | "approved" | "cancelled";
  pr2_order_status: "pending" | "in_progress" | "completed" | "cancelled";
  pr2_inventory_count_status: "draft" | "completed" | "cancelled";
  pr2_stock_movement_type: "purchase_received" | "order_completed" | "inventory_adjustment";
};

type BaseRow = {
  id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
};

type ActiveRow = BaseRow & {
  active: boolean;
};

export type Pr2Unit = ActiveRow & {
  name: string;
  abbreviation: string;
};

export type Pr2MaterialCategory = ActiveRow & {
  name: string;
};

export type Pr2ProductCategory = ActiveRow & {
  name: string;
};

export type Pr2Supplier = ActiveRow & {
  name: string;
  website: string | null;
  notes: string | null;
};

export type Pr2Customer = ActiveRow & {
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export type Pr2Setting = ActiveRow & {
  key: string;
  value: Json;
};

export type Pr2Material = ActiveRow & {
  name: string;
  category_id: UUID | null;
  unit_id: UUID;
  current_stock: Numeric;
  minimum_stock: Numeric;
  reference_cost_per_unit: Numeric;
  preferred_supplier_id: UUID | null;
  notes: string | null;
};

export type Pr2Purchase = ActiveRow & {
  purchase_number: string;
  supplier_id: UUID;
  ordered_at: DateString;
  received_at: DateString | null;
  status: Pr2Enums["pr2_purchase_status"];
  notes: string | null;
};

export type Pr2PurchaseItem = ActiveRow & {
  purchase_id: UUID;
  material_id: UUID;
  quantity: Numeric;
  unit_id: UUID;
  subtotal: Numeric;
  tax: Numeric;
  shipping_allocated: Numeric;
  total_cost: Numeric;
  unit_cost: Numeric;
};

export type Pr2Product = ActiveRow & {
  name: string;
  category_id: UUID | null;
  description: string | null;
  image_url: string | null;
  default_margin_percent: Numeric;
  default_packaging_id: UUID | null;
  labor_cost_fixed: Numeric;
  extra_cost_fixed: Numeric;
};

export type Pr2ProductVariant = ActiveRow & {
  product_id: UUID;
  name: string;
  sku: string | null;
  description: string | null;
  image_url: string | null;
  margin_percent: Numeric | null;
  labor_cost_fixed: Numeric | null;
};

export type Pr2ProductMaterial = ActiveRow & {
  product_id: UUID;
  variant_id: UUID | null;
  material_id: UUID;
  quantity: Numeric;
  unit_id: UUID;
  notes: string | null;
};

export type Pr2Packaging = ActiveRow & {
  name: string;
  description: string | null;
  image_url: string | null;
  margin_percent: Numeric;
};

export type Pr2PackagingMaterial = ActiveRow & {
  packaging_id: UUID;
  material_id: UUID;
  quantity: Numeric;
  unit_id: UUID;
  notes: string | null;
};

export type Pr2Quote = ActiveRow & {
  quote_number: string;
  customer_id: UUID;
  status: Pr2Enums["pr2_quote_status"];
  subtotal: Numeric;
  discount: Numeric;
  total: Numeric;
  notes: string | null;
  language_preference: string;
};

export type Pr2QuoteItem = ActiveRow & {
  quote_id: UUID;
  product_id: UUID;
  variant_id: UUID | null;
  packaging_id: UUID | null;
  quantity: number;
  unit_price: Numeric;
  total_price: Numeric;
  pricing_snapshot: Json;
};

export type Pr2Order = ActiveRow & {
  order_number: string;
  quote_id: UUID | null;
  customer_id: UUID;
  status: Pr2Enums["pr2_order_status"];
  subtotal: Numeric;
  discount: Numeric;
  total: Numeric;
  notes: string | null;
};

export type Pr2OrderItem = ActiveRow & {
  order_id: UUID;
  quote_item_id: UUID | null;
  product_id: UUID;
  variant_id: UUID | null;
  packaging_id: UUID | null;
  quantity: number;
  unit_price: Numeric;
  total_price: Numeric;
  pricing_snapshot: Json;
};

export type Pr2InventoryCount = ActiveRow & {
  counted_at: DateString;
  status: Pr2Enums["pr2_inventory_count_status"];
  notes: string | null;
};

export type Pr2InventoryCountItem = ActiveRow & {
  inventory_count_id: UUID;
  material_id: UUID;
  expected_quantity: Numeric;
  counted_quantity: Numeric;
  quantity_difference: Numeric;
  notes: string | null;
};

export type Pr2StockMovement = BaseRow & {
  material_id: UUID;
  type: Pr2Enums["pr2_stock_movement_type"];
  quantity_change: Numeric;
  previous_quantity: Numeric;
  new_quantity: Numeric;
  source_type: string;
  source_id: UUID;
  notes: string | null;
};

export type Pr2LowStockMaterialView = {
  id: UUID | null;
  name: string | null;
  category_id: UUID | null;
  unit_id: UUID | null;
  current_stock: Numeric | null;
  minimum_stock: Numeric | null;
  needed_quantity: Numeric | null;
  preferred_supplier_id: UUID | null;
  active: boolean | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
};

export type Pr2ShoppingListView = {
  material_id: UUID | null;
  material_name: string | null;
  unit_id: UUID | null;
  current_stock: Numeric | null;
  minimum_stock: Numeric | null;
  needed_quantity: Numeric | null;
  preferred_supplier_id: UUID | null;
  preferred_supplier_name: string | null;
};

export type Database = {
  public: {
    Tables: {
      pr2_units: Pr2Table<Pr2Unit>;
      pr2_material_categories: Pr2Table<Pr2MaterialCategory>;
      pr2_product_categories: Pr2Table<Pr2ProductCategory>;
      pr2_suppliers: Pr2Table<Pr2Supplier>;
      pr2_customers: Pr2Table<Pr2Customer>;
      pr2_settings: Pr2Table<Pr2Setting>;
      pr2_materials: Pr2Table<Pr2Material>;
      pr2_purchases: Pr2Table<Pr2Purchase>;
      pr2_purchase_items: Pr2Table<Pr2PurchaseItem>;
      pr2_products: Pr2Table<Pr2Product>;
      pr2_product_variants: Pr2Table<Pr2ProductVariant>;
      pr2_product_materials: Pr2Table<Pr2ProductMaterial>;
      pr2_packaging: Pr2Table<Pr2Packaging>;
      pr2_packaging_materials: Pr2Table<Pr2PackagingMaterial>;
      pr2_quotes: Pr2Table<Pr2Quote>;
      pr2_quote_items: Pr2Table<Pr2QuoteItem>;
      pr2_orders: Pr2Table<Pr2Order>;
      pr2_order_items: Pr2Table<Pr2OrderItem>;
      pr2_inventory_counts: Pr2Table<Pr2InventoryCount>;
      pr2_inventory_count_items: Pr2Table<Pr2InventoryCountItem>;
      pr2_stock_movements: Pr2Table<Pr2StockMovement>;
    };
    Views: {
      pr2_low_stock_materials_view: {
        Row: Pr2LowStockMaterialView;
        Relationships: [];
      };
      pr2_shopping_list_view: {
        Row: Pr2ShoppingListView;
        Relationships: [];
      };
    };
    Functions: {
      pr2_set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      pr2_apply_purchase_received: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      pr2_apply_order_completed: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      pr2_apply_inventory_count_completed: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      pr2_recalculate_material_reference_cost: {
        Args: { pr2_material_id: string };
        Returns: number;
      };
      pr2_recalculate_received_purchase: {
        Args: { pr2_purchase_id: string };
        Returns: unknown;
      };
      pr2_receive_purchase: {
        Args: { pr2_purchase_id: string; pr2_received_at?: string };
        Returns: unknown;
      };
      pr2_cancel_purchase: {
        Args: { pr2_purchase_id: string };
        Returns: unknown;
      };
      pr2_create_inventory_count_items: {
        Args: { pr2_inventory_count_id: string };
        Returns: unknown;
      };
      pr2_finalize_inventory_count: {
        Args: { pr2_inventory_count_id: string };
        Returns: unknown;
      };
    };
    Enums: Pr2Enums;
    CompositeTypes: Record<string, never>;
  };
};

export type Pr2TableName = keyof Database["public"]["Tables"];
export type Pr2ViewName = keyof Database["public"]["Views"];
