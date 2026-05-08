import {
  Archive,
  ClipboardList,
  Home,
  Layers,
  Package,
  PackageCheck,
  ReceiptText,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
} from "lucide-react";

export const appNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/materials", label: "Materials", icon: Layers },
  { href: "/purchases", label: "Purchases", icon: ReceiptText },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/products", label: "Products", icon: Tags },
  { href: "/packaging", label: "Packaging", icon: Package },
  { href: "/quotes", label: "Quotes", icon: ClipboardList },
  { href: "/orders", label: "Orders", icon: PackageCheck },
  { href: "/inventory", label: "Inventory", icon: Archive },
  { href: "/shopping-list", label: "Shopping", icon: ShoppingCart },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
