import type { ReactNode } from "react";

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
