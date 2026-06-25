"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBag, Menu, X, Search, User } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/products?gender=MEN", label: "Men" },
  { href: "/products?gender=WOMEN", label: "Women" },
  { href: "/products?gender=KIDS", label: "Kids" },
  { href: "/products", label: "All Shoes" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-colors",
        scrolled ? "border-border bg-bone/95 backdrop-blur-sm" : "border-transparent bg-bone"
      )}
    >
      {/* Trust bar */}
      <div className="hidden bg-forest text-bone sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-6 py-1.5 text-xs font-medium tracking-wide">
          <span>Pay with M-Pesa at checkout</span>
          <span className="h-1 w-1 rounded-full bg-bone/40" />
          <span>Delivery countrywide — Nairobi to Nakuru</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-clay text-bone">S</span>
          Savanna<span className="text-clay">&amp;</span>Sole
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold uppercase tracking-wide text-ink/80 transition-colors hover:text-clay"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
            <Link href="/products" aria-label="Search products">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
            <Link href="/account" aria-label="Account">
              <User className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-clay text-[10px] font-bold text-bone">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-border bg-bone px-6 py-4 lg:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-sm px-2 py-2.5 text-sm font-semibold uppercase tracking-wide text-ink/80 hover:bg-ink/5"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/account"
            onClick={() => setMobileOpen(false)}
            className="rounded-sm px-2 py-2.5 text-sm font-semibold uppercase tracking-wide text-ink/80 hover:bg-ink/5"
          >
            My Account
          </Link>
        </nav>
      )}
    </header>
  );
}
