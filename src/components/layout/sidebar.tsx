"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { appNavItems } from "@/constants/navigation";
import { cn } from "@/lib/formatting/class-name";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-border bg-surface px-4 py-5 lg:block">
      <Link className="mb-8 flex items-center gap-3 px-2" href="/dashboard">
        <span className="flex size-8 items-center justify-center rounded-md bg-accent/10 text-sm font-medium text-accent">
          PR
        </span>
        <span className="text-base font-medium text-foreground">Paper Rosie</span>
      </Link>
      <nav aria-label="Main navigation" className="space-y-1">
        {appNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-zinc-50 hover:text-foreground",
                active && "bg-accent/10 text-accent hover:bg-accent/10 hover:text-accent",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
