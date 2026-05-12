export interface NavItem {
  href: string;
  label: string;
  icon: string;
  group?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Início", icon: "home", group: "" },

  { href: "/suppliers", label: "Fornecedores", icon: "storefront", group: "Cadastros" },
  { href: "/materials", label: "Materiais", icon: "inventory_2", group: "Cadastros" },
  { href: "/packaging", label: "Embalagens", icon: "deployed_code", group: "Cadastros" },
  { href: "/clients", label: "Clientes", icon: "group", group: "Cadastros" },

  { href: "/products", label: "Produtos", icon: "stylus_note", group: "Produtos" },
  { href: "/purchases", label: "Compras", icon: "shopping_bag", group: "Produtos" },
  { href: "/inventory", label: "Inventário", icon: "monitoring", group: "Produtos" },

  { href: "/orders", label: "Pedidos", icon: "receipt_long", group: "Vendas" },
  { href: "/quotes", label: "Orçamentos", icon: "request_quote", group: "Vendas" },

  { href: "/settings", label: "Configurações", icon: "settings", group: "" },
];

// Items shown in the mobile bottom nav (most used)
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Início", icon: "home", group: "" },
  { href: "/orders", label: "Pedidos", icon: "receipt_long", group: "" },
  { href: "/quotes", label: "Orçamentos", icon: "request_quote", group: "" },
  { href: "/products", label: "Produtos", icon: "stylus_note", group: "" },
  { href: "/settings", label: "Mais", icon: "menu", group: "" },
];
