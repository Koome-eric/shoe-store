import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-bone">
      <div className="ruler-divider" />
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="col-span-2">
          <div className="font-display text-xl font-extrabold tracking-tight">
            Savanna<span className="text-clay">&amp;</span>Sole
          </div>
          <p className="mt-3 max-w-xs text-sm text-bone/60">
            Online-only shoe store built for Kenyan feet and Kenyan roads.
            Order on the site or straight through WhatsApp.
          </p>
          <div className="mt-5 flex gap-3">
            <a href="#" aria-label="Instagram" className="rounded-sm border border-bone/20 p-2 hover:border-clay hover:text-clay">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="#" aria-label="Facebook" className="rounded-sm border border-bone/20 p-2 hover:border-clay hover:text-clay">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M15 4h-2a4 4 0 0 0-4 4v2H7v3h2v7h3v-7h2.5l.5-3H12V8a1 1 0 0 1 1-1h2z" />
              </svg>
            </a>
            <a href="#" aria-label="WhatsApp" className="rounded-sm border border-bone/20 p-2 hover:border-clay hover:text-clay">
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-bone/50">Shop</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-bone/80">
            <li><Link href="/products?gender=MEN" className="hover:text-clay">Men</Link></li>
            <li><Link href="/products?gender=WOMEN" className="hover:text-clay">Women</Link></li>
            <li><Link href="/products?gender=KIDS" className="hover:text-clay">Kids</Link></li>
            <li><Link href="/products" className="hover:text-clay">New Arrivals</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-bone/50">Help</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-bone/80">
            <li><Link href="/account/orders" className="hover:text-clay">Track Order</Link></li>
            <li><Link href="/#faq" className="hover:text-clay">FAQ</Link></li>
            <li><Link href="/delivery-returns" className="hover:text-clay">Delivery &amp; Returns</Link></li>
            <li><Link href="/contact" className="hover:text-clay">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-bone/50">Stay in the loop</h4>
          <p className="mt-4 text-sm text-bone/70">New drops and restocks, no spam.</p>
          <form className="mt-3 flex gap-2">
            <Input
              type="email"
              placeholder="you@email.com"
              className="border-bone/20 bg-ink text-bone placeholder:text-bone/40"
            />
            <Button type="submit" size="sm">Join</Button>
          </form>
        </div>
      </div>

      <div className="border-t border-bone/10 px-6 py-5 text-center text-xs text-bone/50">
        © {new Date().getFullYear()} Savanna &amp; Sole. Built for the ground you walk on.
      </div>
    </footer>
  );
}
