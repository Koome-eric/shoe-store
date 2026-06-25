"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKES } from "@/lib/utils";
import type { Product, ProductImage, ProductVariant, Brand, Category } from "@/generated/prisma/client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ProductRow = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
  brand: Brand | null;
  category: Category | null;
};

const STATUS_VARIANT: Record<string, "default" | "success" | "outline"> = {
  ACTIVE: "success",
  DRAFT: "outline",
  ARCHIVED: "default",
};

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading, mutate } = useSWR<ProductRow[]>(
    `/api/admin/products${search ? `?q=${encodeURIComponent(search)}` : ""}`,
    fetcher
  );

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This can't be undone unless the product has order history, in which case it will be archived instead.`)) {
      return;
    }
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Product removed");
      mutate();
    } else {
      toast.error("Failed to delete product");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your catalog, variants, and stock.</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-bone-deep text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))}

            {!isLoading && products?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No products yet.{" "}
                  <Link href="/admin/products/new" className="font-semibold text-clay hover:underline">
                    Add your first product
                  </Link>
                </td>
              </tr>
            )}

            {products?.map((product) => {
              const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
              return (
                <tr key={product.id} className="hover:bg-bone-deep/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-bone-deep">
                        {product.images[0] && (
                          <Image src={product.images[0].url} alt={product.name} fill className="object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{product.category?.name ?? "—"}</td>
                  <td className="px-4 py-3">{formatKES(product.sellingPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={totalStock === 0 ? "text-destructive" : totalStock <= 10 ? "text-clay" : ""}>
                      {totalStock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[product.status]}>{product.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" asChild>
                        <Link href={`/admin/products/${product.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(product.id, product.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
