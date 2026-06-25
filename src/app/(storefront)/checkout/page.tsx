"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Smartphone, Truck, CheckCircle2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatKES } from "@/lib/utils";
import { KENYAN_COUNTIES } from "@/lib/kenya-counties";

type Stage = "form" | "placing" | "stk-pending" | "success" | "cod-success" | "error";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const [stage, setStage] = useState<Stage>("form");
  const [orderInfo, setOrderInfo] = useState<{ orderId: string; orderNumber: string; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "MPESA",
      items: [],
    },
  });

  const paymentMethod = watch("paymentMethod");
  const sub = subtotal();
  const shippingFee = 250;
  const total = sub + shippingFee;

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (items.length === 0 && stage === "form") {
      router.replace("/cart");
    }
  }, [items, stage, router]);

  async function onSubmit(data: CheckoutInput) {
    setStage("placing");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            productName: i.productName,
            size: i.size,
            color: i.color,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error || "Could not place your order. Please try again.");
        setStage("error");
        return;
      }

      setOrderInfo({ orderId: json.orderId, orderNumber: json.orderNumber, total: json.total });

      if (data.paymentMethod === "CASH_ON_DELIVERY") {
        clearCart();
        setStage("cod-success");
        return;
      }

      // M-Pesa: trigger STK push, then poll for the callback result.
      const stkRes = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: json.orderId, phone: data.phone }),
      });
      const stkJson = await stkRes.json();

      if (!stkRes.ok) {
        setErrorMsg(stkJson.error || "Could not start M-Pesa payment. Your order is saved — you can retry payment from your order page.");
        setStage("error");
        return;
      }

      setStage("stk-pending");
      startPolling(json.orderId);
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStage("error");
    }
  }

  function startPolling(orderId: string) {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/mpesa/status?orderId=${orderId}`);
        const json = await res.json();

        if (json.paymentStatus === "PAID") {
          clearInterval(pollRef.current!);
          clearCart();
          setStage("success");
        } else if (json.paymentStatus === "FAILED") {
          clearInterval(pollRef.current!);
          setErrorMsg(json.resultDesc || "Payment was not completed. You can try again.");
          setStage("error");
        }
      } catch {
        // transient network error during polling — keep trying
      }

      if (attempts >= 40) {
        // ~2 minutes at 3s interval
        clearInterval(pollRef.current!);
        setErrorMsg("We didn't receive confirmation in time. If you completed the M-Pesa prompt, your order will still be marked paid shortly — check your order status.");
        setStage("error");
      }
    }, 3000);
  }

  if (stage === "stk-pending") {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <Smartphone className="mx-auto h-12 w-12 text-clay animate-pulse" />
        <h1 className="mt-6 font-display text-2xl font-bold">Check your phone</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your M-Pesa PIN on the prompt sent to your phone to complete payment of{" "}
          <strong>{orderInfo && formatKES(orderInfo.total)}</strong>.
        </p>
        <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-clay" />
        <p className="mt-4 text-xs text-muted-foreground">
          Order {orderInfo?.orderNumber} — waiting for confirmation…
        </p>
      </div>
    );
  }

  if (stage === "success" || stage === "cod-success") {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-6 font-display text-2xl font-bold">
          {stage === "success" ? "Payment received!" : "Order placed!"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {stage === "cod-success"
            ? "We'll call to confirm before dispatch. Pay on delivery."
            : "Your order is confirmed and being prepared."}
        </p>
        <p className="mt-4 font-mono text-sm">Order #{orderInfo?.orderNumber}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={`/orders/${orderInfo?.orderId}`}>Track this order</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">Continue shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-destructive">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{errorMsg}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {orderInfo && (
            <Button asChild>
              <Link href={`/orders/${orderInfo.orderId}`}>View order</Link>
            </Button>
          )}
          <Button variant="outline" onClick={() => setStage("form")}>
            Back to checkout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Checkout</h1>
      <div className="ruler-divider mt-4 mb-8" />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section>
            <h2 className="font-display text-lg font-bold">Contact &amp; Delivery</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" className="mt-1.5" {...register("fullName")} />
                {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" placeholder="0712 345 678" className="mt-1.5" {...register("phone")} />
                {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" type="email" className="mt-1.5" {...register("email")} />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="county">County</Label>
                <Select onValueChange={(v) => setValue("county", v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {KENYAN_COUNTIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.county && <p className="mt-1 text-xs text-destructive">{errors.county.message}</p>}
              </div>
              <div>
                <Label htmlFor="town">Town</Label>
                <Input id="town" className="mt-1.5" {...register("town")} />
                {errors.town && <p className="mt-1 text-xs text-destructive">{errors.town.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="street">Street / Building / Landmark</Label>
                <Input id="street" className="mt-1.5" {...register("street")} />
                {errors.street && <p className="mt-1 text-xs text-destructive">{errors.street.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Delivery notes (optional)</Label>
                <Textarea id="notes" className="mt-1.5" {...register("notes")} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">Payment</h2>
            <div className="mt-4 space-y-3">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 ${
                  paymentMethod === "MPESA" ? "border-clay bg-clay/5" : "border-border"
                }`}
              >
                <input type="radio" value="MPESA" {...register("paymentMethod")} className="accent-clay" />
                <Smartphone className="h-5 w-5 text-clay" />
                <div>
                  <p className="font-medium">M-Pesa</p>
                  <p className="text-xs text-muted-foreground">Pay instantly via STK push to your phone</p>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 ${
                  paymentMethod === "CASH_ON_DELIVERY" ? "border-clay bg-clay/5" : "border-border"
                }`}
              >
                <input type="radio" value="CASH_ON_DELIVERY" {...register("paymentMethod")} className="accent-clay" />
                <Truck className="h-5 w-5 text-clay" />
                <div>
                  <p className="font-medium">Cash on Delivery</p>
                  <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
                </div>
              </label>
            </div>
          </section>
        </div>

        <div className="rounded-md border border-border bg-card p-6 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-display text-lg font-bold">Order Summary</h2>
          <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.variantId} className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-bone-deep">
                  {item.image && <Image src={item.image} alt={item.productName} fill className="object-cover" />}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium line-clamp-1">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    Size {item.size} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium">{formatKES(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatKES(sub)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatKES(shippingFee)}</span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between font-display text-lg font-bold">
            <span>Total</span>
            <span>{formatKES(total)}</span>
          </div>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={stage === "placing"}>
            {stage === "placing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Placing order…
              </>
            ) : (
              "Place Order"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
