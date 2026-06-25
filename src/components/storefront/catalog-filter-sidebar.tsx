"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface CatalogFilterSidebarProps {
  sizes: string[];
  colors: string[];
  brands: { id: string; name: string; slug: string }[];
}

const GENDERS = [
  { value: "MEN", label: "Men" },
  { value: "WOMEN", label: "Women" },
  { value: "KIDS", label: "Kids" },
  { value: "UNISEX", label: "Unisex" },
];

function CatalogFilterSidebarInner({ sizes, colors, brands }: CatalogFilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  }

  function toggleMulti(key: string, value: string) {
    const current = searchParams.get(key);
    updateParam(key, current === value ? null : value);
  }

  function applyPriceRange() {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Gender</h3>
        <div className="mt-3 space-y-2">
          {GENDERS.map((g) => (
            <label key={g.value} className="flex items-center gap-2.5 text-sm">
              <Checkbox
                checked={searchParams.get("gender") === g.value}
                onCheckedChange={() => toggleMulti("gender", g.value)}
              />
              {g.label}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {brands.length > 0 && (
        <>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Brand</h3>
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {brands.map((b) => (
                <label key={b.id} className="flex items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={searchParams.get("brand") === b.slug}
                    onCheckedChange={() => toggleMulti("brand", b.slug)}
                  />
                  {b.name}
                </label>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {sizes.length > 0 && (
        <>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Size</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map((size) => {
                const active = searchParams.get("size") === size;
                return (
                  <button
                    key={size}
                    onClick={() => toggleMulti("size", size)}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-sm border px-2 text-sm font-medium transition-colors ${
                      active ? "border-clay bg-clay text-bone" : "border-ink/20 hover:border-clay"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
          <Separator />
        </>
      )}

      {colors.length > 0 && (
        <>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Color</h3>
            <div className="mt-3 space-y-2">
              {colors.map((color) => (
                <label key={color} className="flex items-center gap-2.5 text-sm capitalize">
                  <Checkbox
                    checked={searchParams.get("color") === color}
                    onCheckedChange={() => toggleMulti("color", color)}
                  />
                  {color}
                </label>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price (KES)</h3>
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-9 text-sm"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={applyPriceRange}>
          Apply
        </Button>
      </div>

      {searchParams.toString() && (
        <Button size="sm" variant="ghost" className="w-full text-clay" onClick={() => router.push("/products")}>
          Clear all filters
        </Button>
      )}
    </div>
  );
}

export function CatalogFilterSidebar(props: CatalogFilterSidebarProps) {
  return (
    <Suspense>
      <CatalogFilterSidebarInner {...props} />
    </Suspense>
  );
}

export function MobileFilterLabel({ label }: { label: string }) {
  return <Label className="block mb-2">{label}</Label>;
}
