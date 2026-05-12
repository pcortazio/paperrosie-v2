"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./StudioShell";
import { NAV_ITEMS } from "./nav-items";
import styles from "./sidebar.module.css";

function groupItems() {
  const groups: { label: string; items: typeof NAV_ITEMS }[] = [];
  let current: (typeof groups)[0] | null = null;

  for (const item of NAV_ITEMS) {
    const groupLabel = item.group ?? "";
    if (!current || current.label !== groupLabel) {
      current = { label: groupLabel, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }
  return groups;
}

const GROUPS = groupItems();

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      {/* Logo */}
      <div className={styles.logo}>
        {collapsed ? (
          <span className={styles.logoIcon}>PR</span>
        ) : (
          <>
            <span className={styles.logoName}>Paper Rosie</span>
            <span className={styles.logoSub}>Studio</span>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {GROUPS.map((group) => (
          <div key={group.label} className={styles.group}>
            {group.label && !collapsed && (
              <span className={styles.groupLabel}>{group.label}</span>
            )}
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.item} ${isActive(item.href) ? styles.active : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={`${styles.icon} material-symbols-outlined`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className={styles.label}>{item.label}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        className={styles.collapseBtn}
        onClick={toggle}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        <span className="material-symbols-outlined">
          {collapsed ? "chevron_right" : "chevron_left"}
        </span>
      </button>
    </aside>
  );
}
