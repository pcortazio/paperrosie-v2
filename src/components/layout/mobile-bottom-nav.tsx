"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { appNavItems } from "@/constants/navigation";
import { cn } from "@/lib/formatting/class-name";

const primaryMobileItems = appNavItems.filter((item) =>
  ["/dashboard", "/materials", "/products", "/orders", "/settings"].includes(item.href),
);

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border/90 bg-surface/95 px-2 pb-2 pt-1 shadow-[0_-8px_24px_rgba(0,0,0,0.045)] backdrop-blur lg:hidden"
    >
      <div className="grid grid-cols-5 gap-1">
        {primaryMobileItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "flex h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-muted transition-colors hover:bg-zinc-50",
                active && "bg-accent/10 text-accent",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
