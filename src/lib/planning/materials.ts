import type {
  Pr2Customer,
  Pr2Material,
  Pr2Order,
  Pr2OrderItem,
  Pr2PackagingMaterial,
  Pr2ProductMaterial,
  Pr2Supplier,
  Pr2Unit,
} from "@/types/database";

export type PlanningMaterial = Pr2Material & {
  preferred_supplier?: Pr2Supplier | null;
  unit?: Pr2Unit | null;
};

export type PlanningOrder = Pr2Order & {
  customer?: Pr2Customer | null;
  items: Pr2OrderItem[];
};

export type PlanningProductMaterial = Pr2ProductMaterial & {
  material: PlanningMaterial | null;
};

export type PlanningPackagingMaterial = Pr2PackagingMaterial & {
  material: PlanningMaterial | null;
};

export type OrderMaterialRequirement = {
  material: PlanningMaterial;
  orderIds: string[];
  orders: Array<{
    id: string;
    orderNumber: string;
    customerName: string | null;
    quantity: number;
  }>;
  requiredQuantity: number;
};

export type MaterialShortage = {
  currentStock: number;
  inactiveRequired: boolean;
  lowStockQuantity: number;
  material: PlanningMaterial;
  minimumStock: number;
  orderIds: string[];
  orderRequiredQuantity: number;
  orders: OrderMaterialRequirement["orders"];
  remainingAfterOrders: number;
  shortageQuantity: number;
};

export type ShoppingListReason = "low_stock" | "needed_for_orders";

export type ShoppingListItem = MaterialShortage & {
  preferredSupplier: Pr2Supplier | null;
  reasons: ShoppingListReason[];
};

export type SupplierShoppingListGroup = {
  items: ShoppingListItem[];
  supplier: Pr2Supplier | null;
  supplierId: string | null;
  supplierName: string;
  totalShortageQuantity: number;
};

export function calculateLowStockMaterials(materials: PlanningMaterial[]) {
  return materials
    .filter((material) => material.active && material.current_stock <= material.minimum_stock)
    .map((material) => ({
      material,
      shortageQuantity: Math.max(material.minimum_stock - material.current_stock, 0),
    }));
}

export function calculateOrderMaterialRequirements(input: {
  orders: PlanningOrder[];
  packagingMaterials: PlanningPackagingMaterial[];
  productMaterials: PlanningProductMaterial[];
}) {
  const requirements = new Map<string, OrderMaterialRequirement>();
  const productMaterialsByProduct = groupBy(input.productMaterials, (line) => line.product_id);
  const packagingMaterialsByPackaging = groupBy(input.packagingMaterials, (line) => line.packaging_id);

  for (const order of input.orders.filter((item) => item.status === "pending" || item.status === "in_progress")) {
    for (const item of order.items.filter((line) => line.active)) {
      const productLines = productMaterialsByProduct.get(item.product_id) ?? [];
      const packagingLines = item.packaging_id ? packagingMaterialsByPackaging.get(item.packaging_id) ?? [] : [];

      for (const line of productLines) {
        if (line.variant_id !== null && line.variant_id !== item.variant_id) continue;
        addRequirement(requirements, line, line.material, order, item.quantity);
      }

      for (const line of packagingLines) {
        addRequirement(requirements, line, line.material, order, item.quantity);
      }
    }
  }

  return Array.from(requirements.values()).sort((a, b) => a.material.name.localeCompare(b.material.name));
}

export function calculateMaterialShortages(input: {
  materials: PlanningMaterial[];
  orderRequirements: OrderMaterialRequirement[];
}) {
  const lowStockByMaterial = new Map(
    calculateLowStockMaterials(input.materials).map((item) => [item.material.id, item.shortageQuantity]),
  );
  const materialById = new Map(input.materials.map((material) => [material.id, material]));
  const requirementByMaterial = new Map(input.orderRequirements.map((item) => [item.material.id, item]));
  const ids = new Set([...lowStockByMaterial.keys(), ...requirementByMaterial.keys()]);

  return Array.from(ids)
    .map((materialId) => {
      const requirement = requirementByMaterial.get(materialId);
      const material = requirement?.material ?? materialById.get(materialId);
      if (!material) return null;

      const orderRequiredQuantity = requirement?.requiredQuantity ?? 0;
      const orderShortageQuantity = Math.max(orderRequiredQuantity - material.current_stock, 0);
      const lowStockQuantity = lowStockByMaterial.get(materialId) ?? 0;
      const shortageQuantity = Math.max(lowStockQuantity, orderShortageQuantity);

      return {
        currentStock: material.current_stock,
        inactiveRequired: !material.active && orderRequiredQuantity > 0,
        lowStockQuantity,
        material,
        minimumStock: material.minimum_stock,
        orderIds: requirement?.orderIds ?? [],
        orderRequiredQuantity,
        orders: requirement?.orders ?? [],
        remainingAfterOrders: material.current_stock - orderRequiredQuantity,
        shortageQuantity,
      } satisfies MaterialShortage;
    })
    .filter((item): item is MaterialShortage => Boolean(item))
    .filter((item) => item.shortageQuantity > 0 || item.inactiveRequired)
    .sort((a, b) => a.material.name.localeCompare(b.material.name));
}

export function generateShoppingList(input: {
  materials: PlanningMaterial[];
  orderRequirements: OrderMaterialRequirement[];
}) {
  return calculateMaterialShortages(input).map((shortage) => {
    const reasons: ShoppingListReason[] = [];
    if (shortage.lowStockQuantity > 0) reasons.push("low_stock");
    if (shortage.orderRequiredQuantity > shortage.currentStock) reasons.push("needed_for_orders");

    return {
      ...shortage,
      preferredSupplier: shortage.material.preferred_supplier ?? null,
      reasons,
    } satisfies ShoppingListItem;
  });
}

export function groupShoppingListBySupplier(items: ShoppingListItem[]) {
  const groups = new Map<string, SupplierShoppingListGroup>();

  for (const item of items) {
    const supplier = item.preferredSupplier;
    const supplierId = supplier?.id ?? null;
    const key = supplierId ?? "unassigned";
    const group = groups.get(key) ?? {
      items: [],
      supplier,
      supplierId,
      supplierName: supplier?.name ?? "Unassigned Supplier",
      totalShortageQuantity: 0,
    };
    group.items.push(item);
    group.totalShortageQuantity += item.shortageQuantity;
    groups.set(key, group);
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.supplierId === null) return 1;
    if (b.supplierId === null) return -1;
    return a.supplierName.localeCompare(b.supplierName);
  });
}

function addRequirement(
  requirements: Map<string, OrderMaterialRequirement>,
  line: Pr2ProductMaterial | Pr2PackagingMaterial,
  material: PlanningMaterial | null,
  order: PlanningOrder,
  orderQuantity: number,
) {
  if (!line.active || !material) return;

  const quantity = line.quantity * orderQuantity;
  const current = requirements.get(material.id) ?? {
    material,
    orderIds: [],
    orders: [],
    requiredQuantity: 0,
  };
  current.requiredQuantity += quantity;

  const existingOrder = current.orders.find((item) => item.id === order.id);
  if (existingOrder) {
    existingOrder.quantity += quantity;
  } else {
    current.orderIds.push(order.id);
    current.orders.push({
      customerName: order.customer?.name ?? null,
      id: order.id,
      orderNumber: order.order_number,
      quantity,
    });
  }

  requirements.set(material.id, current);
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  return grouped;
}
