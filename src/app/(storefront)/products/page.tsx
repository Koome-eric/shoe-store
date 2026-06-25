import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import { getCatalog, getAllSizesAndColors, getAllBrands } from "@/lib/queries/storefront";
import { ProductCard } from "@/components/storefront/product-card";
import { CatalogFilterSidebar } from "@/components/storefront/catalog-filter-sidebar";
import { CatalogSort } from "@/components/storefront/catalog-sort";
import { CatalogPagination } from "@/components/storefront/catalog-pagination";
import { MobileFilterDrawer } from "@/components/storefront/mobile-filter-drawer";
import type { Gender } from "@/generated/prisma/client";

export const metadata: Metadata = {
  title: "Shop All Shoes",
  description: "Browse men's, women's, and kids' shoes — filter by size, color, brand, and price.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters = {
    gender: params.gender as Gender | undefined,
    categorySlug: params.category,
    brandSlug: params.brand,
    size: params.size,
    color: params.color,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    q: params.q,
    sort: params.sort as "latest" | "price-asc" | "price-desc" | "best-selling" | undefined,
    page: params.page ? Number(params.page) : 1,
  };

  const [{ products, total, page, totalPages }, { sizes, colors }, brands] = await Promise.all([
    getCatalog(filters),
    getAllSizesAndColors(),
    getAllBrands(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {params.gender
              ? `${params.gender.charAt(0)}${params.gender.slice(1).toLowerCase()}'s Shoes`
              : "All Shoes"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "product" : "products"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile filter trigger */}
          <MobileFilterDrawer sizes={sizes} colors={colors} brands={brands}>
            <button className="flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-sm font-medium hover:border-clay lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
          </MobileFilterDrawer>
          <CatalogSort />
        </div>
      </div>

      <div className="ruler-divider mt-6 mb-8" />

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <CatalogFilterSidebar sizes={sizes} colors={colors} brands={brands} />
        </aside>

        <div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border py-20 text-center text-muted-foreground">
              No products match these filters yet. Try clearing a filter.
            </div>
          )}
          <CatalogPagination page={page} totalPages={totalPages} searchParams={params} />
        </div>
      </div>
    </div>
  );
}
