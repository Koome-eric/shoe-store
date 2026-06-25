"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  LogOut,
  Store,
  Menu,
  X,
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-clay text-bone"
                  : "text-bone/70 hover:bg-bone/10 hover:text-bone"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-bone/10 p-3">
        <Link
          href="/"
          target="_blank"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-bone/70 hover:bg-bone/10 hover:text-bone"
        >
          <Store className="h-4 w-4 shrink-0" /> View store
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
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-ink text-bone lg:flex">
        <div className="flex items-center gap-2 px-5 py-5 font-display text-lg font-extrabold">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-clay text-bone">
            S
          </span>
          Admin
        </div>
        {navContent}
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-ink px-4 text-bone lg:hidden">
        <div className="flex items-center gap-2 font-display text-base font-extrabold">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-clay text-bone text-sm">
            S
          </span>
          Admin
        </div>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-sm p-1.5 hover:bg-bone/10"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* panel */}
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-ink text-bone shadow-2xl">
            <div className="flex h-14 items-center justify-between px-5 font-display text-lg font-extrabold">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-clay text-bone">
                  S
                </span>
                Admin
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-sm p-1 hover:bg-bone/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto pt-2">
              {navContent}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
