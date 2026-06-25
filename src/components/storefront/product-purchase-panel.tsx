"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle, ShoppingBag, Zap, Share2 } from "lucide-react";
import type { Product, ProductVariant, ProductImage, Brand } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { formatKES, buildWhatsAppLink } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

type ProductWithRelations = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
  brand: Brand | null;
};

export function ProductPurchasePanel({ product }: { product: ProductWithRelations }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.size))).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)),
    [product.variants]
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const colorsForSize = useMemo(
    () => (selectedSize ? product.variants.filter((v) => v.size === selectedSize) : product.variants),
    [product.variants, selectedSize]
  );
  const colors = useMemo(() => Array.from(new Set(colorsForSize.map((v) => v.color))), [colorsForSize]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const selectedVariant = useMemo(
    () => product.variants.find((v) => v.size === selectedSize && v.color === selectedColor) ?? null,
    [product.variants, selectedSize, selectedColor]
  );

  const hasDiscount = product.discountPrice && Number(product.discountPrice) < Number(product.sellingPrice);
  const price = hasDiscount ? Number(product.discountPrice) : Number(product.sellingPrice);

  function ensureSelection(): boolean {
    if (!selectedSize) {
      toast.error("Please select a size");
      return false;
    }
    if (!selectedColor) {
      toast.error("Please select a color");
      return false;
    }
    if (!selectedVariant) {
      toast.error("This size/color combination isn't available");
      return false;
    }
    if (selectedVariant.stock === 0) {
      toast.error("This size is out of stock");
      return false;
    }
    return true;
  }

  function handleAddToCart() {
    if (!ensureSelection() || !selectedVariant) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      productName: product.name,
      slug: product.slug,
      size: selectedVariant.size,
      color: selectedVariant.color,
      unitPrice: price,
      quantity: 1,
      image: product.images[0]?.url,
      maxStock: selectedVariant.stock,
    });
    toast.success(`Added ${product.name} (Size ${selectedVariant.size}) to cart`);
  }

  function handleBuyNow() {
    if (!ensureSelection() || !selectedVariant) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      productName: product.name,
      slug: product.slug,
      size: selectedVariant.size,
      color: selectedVariant.color,
      unitPrice: price,
      quantity: 1,
      image: product.images[0]?.url,
      maxStock: selectedVariant.stock,
    });
    router.push("/checkout");
  }

  const whatsappMessage = `I would like to order ${product.name}${selectedSize ? ` Size ${selectedSize}` : ""}`;

  return (
    <div className="space-y-6">
      <div>
        {product.brand && (
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{product.brand.name}</p>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="font-display text-2xl font-bold text-clay">{formatKES(price)}</span>
          {hasDiscount && (
            <span className="text-base text-muted-foreground line-through">{formatKES(product.sellingPrice)}</span>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground/80">{product.description}</p>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Size</p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const variantExists = product.variants.some((v) => v.size === size && v.stock > 0);
            return (
              <button
                key={size}
                disabled={!variantExists}
                onClick={() => {
                  setSelectedSize(size);
                  setSelectedColor(null);
                }}
                className={`flex h-11 min-w-11 items-center justify-center rounded-sm border px-3 text-sm font-semibold transition-colors ${
                  selectedSize === size
                    ? "border-clay bg-clay text-bone"
                    : variantExists
                      ? "border-ink/20 hover:border-clay"
                      : "border-ink/10 text-muted-foreground/40 line-through"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Color</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const variant = product.variants.find((v) => v.size === selectedSize && v.color === color);
              const available = variant ? variant.stock > 0 : true;
              return (
                <button
                  key={color}
                  disabled={!!selectedSize && !available}
                  onClick={() => setSelectedColor(color)}
                  className={`rounded-sm border px-3.5 py-2 text-sm font-medium capitalize transition-colors ${
                    selectedColor === color
                      ? "border-clay bg-clay text-bone"
                      : available
                        ? "border-ink/20 hover:border-clay"
                        : "border-ink/10 text-muted-foreground/40 line-through"
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedVariant && (
        <p className={`text-sm font-medium ${selectedVariant.stock <= 5 ? "text-clay" : "text-emerald-700"}`}>
          {selectedVariant.stock === 0
            ? "Out of stock"
            : selectedVariant.stock <= 5
              ? `Only ${selectedVariant.stock} left in stock`
              : "In stock"}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1" onClick={handleAddToCart}>
          <ShoppingBag className="h-4 w-4" /> Add to Cart
        </Button>
        <Button size="lg" variant="secondary" className="flex-1" onClick={handleBuyNow}>
          <Zap className="h-4 w-4" /> Buy Now
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" variant="outline" className="flex-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50" asChild>
          <a href={buildWhatsAppLink(whatsappMessage)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> Order via WhatsApp
          </a>
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
            } else {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied");
            }
          }}
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>
    </div>
  );
}
