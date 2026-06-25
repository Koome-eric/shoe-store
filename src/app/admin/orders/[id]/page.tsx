import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatKES, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminOrderActions } from "@/components/admin/admin-order-actions";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { images: { take: 1 } } } } },
      payments: { orderBy: { createdAt: "desc" } },
      shipment: true,
      customer: true,
      coupon: true,
    },
  });

  if (!order) notFound();

  const latestPayment = order.payments[0];
  const subtotal = Number(order.subtotal);
  const shippingFee = Number(order.shippingFee);
  const discount = Number(order.discount);
  const total = Number(order.total);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Order #{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <Badge>{order.status.replace("_", " ")}</Badge>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer &amp; delivery</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact</p>
                <p className="mt-1 text-sm">{order.guestName}</p>
                <p className="text-sm text-muted-foreground">{order.guestPhone}</p>
                {order.guestEmail && <p className="text-sm text-muted-foreground">{order.guestEmail}</p>}
                {order.customer && (
                  <p className="mt-1 text-xs text-clay">Registered customer</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Address</p>
                <p className="mt-1 text-sm">{order.street}</p>
                <p className="text-sm text-muted-foreground">{order.town}, {order.county}</p>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notes</p>
                  <p className="mt-1 text-sm">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-bone-deep">
                      {item.product.images[0] && (
                        <Image src={item.product.images[0].url} alt={item.productName} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        Size {item.size} · {item.color} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium">{formatKES(Number(item.unitPrice) * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
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
                    <span>Discount {order.coupon ? `(${order.coupon.code})` : ""}</span>
                    <span>-{formatKES(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 font-display font-bold">
                  <span>Total</span>
                  <span>{formatKES(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p>{p.method === "MPESA" ? "M-Pesa" : "Cash on Delivery"}</p>
                      {p.mpesaReceiptNumber && <p className="text-xs text-muted-foreground font-mono">{p.mpesaReceiptNumber}</p>}
                    </div>
                    <Badge variant={p.status === "PAID" ? "success" : p.status === "FAILED" ? "destructive" : "outline"}>
                      {p.status}
                    </Badge>
                  </div>
                ))}
                {!latestPayment && <p className="text-sm text-muted-foreground">No payment records.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <AdminOrderActions
          orderId={order.id}
          currentStatus={order.status}
          currentCourier={order.shipment?.courierName}
          currentTracking={order.shipment?.trackingNumber}
          currentFulfillment={order.shipment?.status}
        />
      </div>
    </div>
  );
}
