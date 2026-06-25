import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/storefront/product-card";
import { FaqAccordion } from "@/components/storefront/faq-accordion";
import {
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
} from "@/lib/queries/storefront";
import { buildWhatsAppLink } from "@/lib/utils";

export const revalidate = 60;

/** Curated category cards — images are from Unsplash (already in remotePatterns).
 *  Update `image` URLs here or replace with DB-driven values later. */
const CATEGORY_CARDS = [
  {
    slug: "men",
    name: "Men",
    sub: "Sizes 38 – 46",
    href: "/products?gender=MEN",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80&auto=format&fit=crop",
    position: "center",
  },
  {
    slug: "women",
    name: "Women",
    sub: "Sizes 36 – 42",
    href: "/products?gender=WOMEN",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700&q=80&auto=format&fit=crop",
    position: "center top",
  },
  {
    slug: "kids",
    name: "Kids",
    sub: "Sizes 28 – 37",
    href: "/products?gender=KIDS",
    image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=700&q=80&auto=format&fit=crop",
    position: "center",
  },
  {
    slug: "sale",
    name: "On Sale",
    sub: "Up to 40% off",
    href: "/products?sort=price-asc",
    image: "https://images.unsplash.com/photo-1556906781-9a412961a28c?w=700&q=80&auto=format&fit=crop",
    position: "center",
  },
] as const;

export default async function HomePage() {
  const [featured, newArrivals, bestSellers] = await Promise.all([
    getFeaturedProducts(4),
    getNewArrivals(8),
    getBestSellers(4),
  ]);

  return (
    <div>
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative overflow-hidden bg-forest text-bone">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center rounded-full border border-bone/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-bone/80">
              New season, size 36–46
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Shoes built for the ground you walk on.
            </h1>
            <p className="mt-5 max-w-md text-base text-bone/75">
              Nairobi streets, Nakuru murram, Mombasa heat — every pair is
              picked to handle Kenyan ground. Pay with M-Pesa. Delivered to
              your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/products">Shop New Arrivals</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-bone/30 text-bone hover:bg-bone/10"
                asChild
              >
                <a
                  href={buildWhatsAppLink("Hi! I'd like to ask about your shoes.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> Order via WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* Shoebox-label signature device: a tilted card stack evoking a
              product box label, the hero's one bold visual gesture. */}
          <div className="relative mx-auto hidden aspect-[4/3] w-full max-w-md lg:block">
            <div className="absolute inset-0 rotate-3 rounded-lg bg-clay/90" />
            <div className="absolute inset-0 -rotate-2 overflow-hidden rounded-lg bg-bone shadow-2xl">
              {featured[0]?.images[0] ? (
                <Image
                  src={featured[0].images[0].url}
                  alt={featured[0].name}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  loading="eager"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-2xl font-bold text-ink/30">
                  Savanna &amp; Sole
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-ink/90 px-4 py-2 text-bone">
                <span className="font-mono text-xs tracking-wider">SIZE 36–46</span>
                <span className="font-mono text-xs tracking-wider">MADE TO MOVE</span>
              </div>
            </div>
          </div>
        </div>
        <div className="ruler-divider !bg-bone/20" />
      </section>

      {/* ───────────────────────── Trust strip ───────────────────────── */}
      <section className="border-b border-border bg-bone-deep">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-clay" />
            <span className="text-sm font-medium">Countrywide delivery</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-clay" />
            <span className="text-sm font-medium">Secure M-Pesa checkout</span>
          </div>
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-clay" />
            <span className="text-sm font-medium">7-day size exchange</span>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Categories ───────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Shop by category</h2>
            <p className="mt-1 text-sm text-muted-foreground">Find the right pair for your ground.</p>
          </div>
          <Link href="/products" className="hidden text-sm font-semibold text-clay hover:underline sm:block">
            View all
          </Link>
        </div>
        <div className="ruler-divider mt-3 mb-8" />

        {/* Editorial asymmetric grid — big card left, 3 stacked right */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[1fr_1fr_1fr] lg:grid-rows-2 lg:h-[560px]">
          {CATEGORY_CARDS.map((card, i) => (
            <Link
              key={card.slug}
              href={card.href}
              style={{ backgroundImage: `url('${card.image}')`, backgroundSize: "cover", backgroundPosition: card.position ?? "center" }}
              className={`group relative flex items-end overflow-hidden rounded-xl
                ${i === 0
                  ? "col-span-2 aspect-[16/9] lg:col-span-1 lg:row-span-2 lg:aspect-auto"
                  : "aspect-square lg:aspect-auto"
                }`}
            >
              {/* dark scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent transition-opacity duration-300 group-hover:from-ink/90" />
              {/* image zoom */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ backgroundImage: `url('${card.image}')`, backgroundPosition: card.position ?? "center" }}
              />
              {/* label */}
              <div className="relative w-full p-4 sm:p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-bone/50 sm:text-xs">
                  {card.sub}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-display text-xl font-extrabold leading-tight text-bone sm:text-2xl">
                    {card.name}
                  </span>
                  <span className="translate-x-0 opacity-0 text-clay transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link href="/products" className="mt-4 flex items-center justify-center text-sm font-semibold text-clay hover:underline sm:hidden">
          Browse all shoes →
        </Link>
      </section>

      {/* ───────────────────────── Featured ───────────────────────── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Featured</h2>
            <Link href="/products" className="text-sm font-semibold text-clay hover:underline">View all</Link>
          </div>
          <div className="ruler-divider mt-3 mb-8" />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ───────────────────────── New Arrivals ───────────────────────── */}
      <section className="bg-bone-deep">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">New arrivals</h2>
            <Link href="/products?sort=latest" className="text-sm font-semibold text-clay hover:underline">View all</Link>
          </div>
          <div className="ruler-divider mt-3 mb-8" />
          {newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <p className="text-muted-foreground">No products yet — add your first product from the admin dashboard.</p>
          )}
        </div>
      </section>

      {/* ───────────────────────── Best Sellers ───────────────────────── */}
      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Best sellers</h2>
            <Link href="/products?sort=best-selling" className="text-sm font-semibold text-clay hover:underline">View all</Link>
          </div>
          <div className="ruler-divider mt-3 mb-8" />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ───────────────────────── Testimonials ───────────────────────── */}
      <section className="bg-ink text-bone">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">What customers say</h2>
          <div className="ruler-divider mt-3 mb-8 !bg-bone/20" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { name: "Wanjiru, Nairobi", quote: "Ordered size 39 on a Tuesday, had them by Thursday. M-Pesa checkout was instant." },
              { name: "Otieno, Kisumu", quote: "WhatsApp ordering made it easy to confirm my size before paying. Great fit." },
              { name: "Achieng, Nakuru", quote: "Exchanged a size in under a week, no hassle. Will be buying again." },
            ].map((t) => (
              <div key={t.name} className="rounded-md border border-bone/15 p-5">
                <p className="text-sm text-bone/85">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-bone/50">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── FAQ ───────────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Frequently asked</h2>
        <div className="ruler-divider mt-3 mb-8" />
        <FaqAccordion
          items={[
            { q: "How do I pay?", a: "Pay instantly with M-Pesa at checkout — you'll get an STK prompt on your phone. Cash on delivery is also available in select areas." },
            { q: "How long does delivery take?", a: "Nairobi: 1–2 days. Other major towns: 2–4 days. Remote areas may take longer — we'll confirm at checkout." },
            { q: "Can I exchange a size?", a: "Yes — sizes can be exchanged within 7 days of delivery, as long as the shoes are unworn." },
            { q: "Can I order without an account?", a: "Yes, guest checkout is available. Creating an account just makes it faster to track orders and reorder." },
          ]}
        />
      </section>
    </div>
  );
}
