"use client";

import { useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import { Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VariantRow {
  id: string;
  size: string;
  color: string;
  stock: number;
  lowStockThreshold: number;
  product: { id: string; name: string; slug: string; images: { url: string }[] };
}

export default function AdminInventoryPage() {
  const [filter, setFilter] = useState("all");
  const { data: variants, isLoading, mutate } = useSWR<VariantRow[]>(
    `/api/admin/inventory${filter !== "all" ? `?filter=${filter}` : ""}`,
    fetcher
  );

  async function adjust(variantId: string, change: number) {
    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, change, reason: change > 0 ? "Manual restock" : "Manual adjustment" }),
    });
    if (res.ok) mutate();
    else { const json = await res.json(); toast.error(json.error || "Failed to adjust stock"); }
  }

  function StockBadge({ v }: { v: VariantRow }) {
    if (v.stock === 0) return <Badge variant="destructive">Out of stock</Badge>;
    if (v.stock <= v.lowStockThreshold) return <Badge variant="warning">Low stock</Badge>;
    return <Badge variant="success">In stock</Badge>;
  }

  function AdjustButtons({ v }: { v: VariantRow }) {
    return (
      <div className="flex items-center gap-1">
        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjust(v.id, -1)} disabled={v.stock === 0}>
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-8 text-center text-sm font-medium">{v.stock}</span>
        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjust(v.id, 1)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" className="h-8 ml-1" onClick={() => adjust(v.id, 10)}>+10</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stock levels by size and color variant.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All variants</SelectItem>
            <SelectItem value="low">Low stock</SelectItem>
            <SelectItem value="out">Out of stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Mobile card list ── */}
      <div className="mt-6 space-y-3 lg:hidden">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
        {!isLoading && variants?.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">No variants match this filter.</p>
        )}
        {variants?.map((v) => (
          <div key={v.id} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-bone-deep">
                {v.product.images[0] && <Image src={v.product.images[0].url} alt={v.product.name} fill className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{v.product.name}</p>
                <p className="text-xs text-muted-foreground capitalize">Size {v.size} · {v.color}</p>
              </div>
              <StockBadge v={v} />
            </div>
            <div className="mt-3 flex justify-end">
              <AdjustButtons v={v} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop table ── */}
      <div className="mt-6 hidden overflow-x-auto rounded-md border border-border bg-card lg:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-bone-deep text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-8 w-full" /></td></tr>
            ))}
            {!isLoading && variants?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No variants match this filter.</td></tr>
            )}
            {variants?.map((v) => (
              <tr key={v.id} className="hover:bg-bone-deep/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-sm bg-bone-deep">
                      {v.product.images[0] && <Image src={v.product.images[0].url} alt={v.product.name} fill className="object-cover" />}
                    </div>
                    {v.product.name}
                  </div>
                </td>
                <td className="px-4 py-3">{v.size}</td>
                <td className="px-4 py-3 capitalize">{v.color}</td>
                <td className="px-4 py-3 font-medium">{v.stock}</td>
                <td className="px-4 py-3"><StockBadge v={v} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjust(v.id, -1)} disabled={v.stock === 0}><Minus className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjust(v.id, 1)}><Plus className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => adjust(v.id, 10)}>+10</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
