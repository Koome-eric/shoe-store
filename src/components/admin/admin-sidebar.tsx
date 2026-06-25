"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  LogOut,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-ink text-bone">
      <div className="flex items-center gap-2 px-5 py-5 font-display text-lg font-extrabold">
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-clay text-bone">S</span>
        Admin
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-clay text-bone" : "text-bone/70 hover:bg-bone/10 hover:text-bone"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-bone/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-bone/70 hover:bg-bone/10 hover:text-bone"
        >
          <Store className="h-4 w-4" /> View store
        </Link>
        <div className="mt-2 flex items-center justify-between px-3">
          <span className="truncate text-xs text-bone/50">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="text-bone/60 hover:text-clay"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
