"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, Heart, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatKES } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { items, savedForLater, removeItem, updateQuantity, saveForLater, moveToCart, removeSaved, subtotal } =
    useCartStore();

  const sub = subtotal();
  const shippingEstimate = items.length > 0 ? 250 : 0;

  if (items.length === 0 && savedForLater.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Find a pair worth walking in.</p>
        <Button size="lg" className="mt-6" asChild>
          <Link href="/products">Browse shoes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Your Cart</h1>
      <div className="ruler-divider mt-4 mb-8" />

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 border-b border-border pb-6">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-bone-deep">
                {item.image && <Image src={item.image} alt={item.productName} fill className="object-cover" />}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/products/${item.slug}`} className="font-medium hover:text-clay">
                      {item.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Size {item.size} · <span className="capitalize">{item.color}</span>
                    </p>
                  </div>
                  <p className="font-display font-bold">{formatKES(item.unitPrice * item.quantity)}</p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center gap-2 rounded-sm border border-border">
                    <button
                      className="flex h-8 w-8 items-center justify-center hover:bg-ink/5"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      className="flex h-8 w-8 items-center justify-center hover:bg-ink/5"
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <button onClick={() => saveForLater(item.variantId)} className="flex items-center gap-1 hover:text-clay">
                      <Heart className="h-3.5 w-3.5" /> Save for later
                    </button>
                    <button onClick={() => removeItem(item.variantId)} className="flex items-center gap-1 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {savedForLater.length > 0 && (
            <div className="pt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Saved for later</h2>
              <div className="mt-4 space-y-4">
                {savedForLater.map((item) => (
                  <div key={item.variantId} className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-bone-deep">
                      {item.image && <Image src={item.image} alt={item.productName} fill className="object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">Size {item.size} · {item.color}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => moveToCart(item.variantId)}>
                      Move to cart
                    </Button>
                    <button onClick={() => removeSaved(item.variantId)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="rounded-md border border-border bg-card p-6">
            <h2 className="font-display text-lg font-bold">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatKES(sub)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping (estimate)</span>
                <span>{formatKES(shippingEstimate)}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-display text-lg font-bold">
              <span>Total</span>
              <span>{formatKES(sub + shippingEstimate)}</span>
            </div>
            <Button size="lg" className="mt-6 w-full" onClick={() => router.push("/checkout")}>
              Checkout <ArrowRight className="h-4 w-4" />
            </Button>
            <Link href="/products" className="mt-3 block text-center text-sm text-muted-foreground hover:text-clay">
              Continue shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
