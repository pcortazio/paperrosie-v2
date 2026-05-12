"use client";

import { createContext, useContext, useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import styles from "./studio-shell.module.css";

interface SidebarCtx {
  collapsed: boolean;
  toggle: () => void;
}

export const SidebarContext = createContext<SidebarCtx>({
  collapsed: false,
  toggle: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export default function StudioShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>
      <div className={`${styles.shell} ${collapsed ? styles.collapsed : ""}`}>
        <Sidebar />
        <main className={styles.main}>{children}</main>
        <BottomNav />
      </div>
    </SidebarContext.Provider>
  );
}
