import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Circle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatKES, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const STATUS_FLOW = ["PENDING", "AWAITING_PAYMENT", "PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"] as const;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Order placed",
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Payment confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { images: { take: 1 } } } } },
      payments: { orderBy: { createdAt: "desc" } },
      shipment: true,
    },
  });

  if (!order) notFound();

  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
  const currentStepIndex = STATUS_FLOW.indexOf(order.status as typeof STATUS_FLOW[number]);
  const latestPayment = order.payments[0];
  const subtotal = Number(order.subtotal);
  const shippingFee = Number(order.shippingFee);
  const discount = Number(order.discount);
  const total = Number(order.total);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <Badge variant={isCancelled ? "destructive" : "forest"} className="text-sm">
          {STATUS_LABELS[order.status]}
        </Badge>
      </div>

      {!isCancelled && (
        <div className="mt-8">
          <ol className="flex flex-wrap gap-y-4">
            {STATUS_FLOW.map((status, i) => {
              const reached = i <= currentStepIndex;
              return (
                <li key={status} className="flex min-w-[120px] flex-1 items-center gap-2">
                  {reached ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-clay" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className={`text-xs font-medium ${reached ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="ruler-divider mt-8 mb-8" />

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Delivery to</h2>
          <p className="mt-2 text-sm">{order.guestName}</p>
          <p className="text-sm text-muted-foreground">{order.guestPhone}</p>
          <p className="text-sm text-muted-foreground">{order.street}, {order.town}, {order.county}</p>
          {order.shipment?.trackingNumber && (
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">Tracking: </span>
              <span className="font-mono">{order.shipment.trackingNumber}</span>
              {order.shipment.courierName && ` · ${order.shipment.courierName}`}
            </p>
          )}
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payment</h2>
          <p className="mt-2 text-sm">
            {latestPayment?.method === "MPESA" ? "M-Pesa" : "Cash on Delivery"} ·{" "}
            <span className={latestPayment?.status === "PAID" ? "text-emerald-700" : "text-muted-foreground"}>
              {latestPayment?.status}
            </span>
          </p>
          {latestPayment?.mpesaReceiptNumber && (
            <p className="text-sm text-muted-foreground">Receipt: {latestPayment.mpesaReceiptNumber}</p>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Items</h2>
      <div className="mt-4 space-y-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-bone-deep">
              {item.product.images[0] && (
                <Image src={item.product.images[0].url} alt={item.productName} fill className="object-cover" />
              )}
            </div>
            <div className="flex-1">
              <Link href={`/products/${item.product.slug}`} className="text-sm font-medium hover:text-clay">
                {item.productName}
              </Link>
              <p className="text-xs text-muted-foreground">
                Size {item.size} · {item.color} · Qty {item.quantity}
              </p>
            </div>
            <p className="text-sm font-medium">{formatKES(Number(item.unitPrice) * item.quantity)}</p>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatKES(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>{formatKES(shippingFee)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-clay">
            <span>Discount</span>
            <span>-{formatKES(discount)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 font-display text-lg font-bold">
          <span>Total</span>
          <span>{formatKES(total)}</span>
        </div>
      </div>
    </div>
  );
}
