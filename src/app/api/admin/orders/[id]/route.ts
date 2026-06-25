import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { restoreStockForOrder } from "@/lib/inventory";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { images: { take: 1 } } } } },
      payments: { orderBy: { createdAt: "desc" } },
      shipment: true,
      customer: true,
      address: true,
      coupon: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

const updateSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "AWAITING_PAYMENT",
      "PAID",
      "PROCESSING",
      "PACKED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ])
    .optional(),
  courierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  fulfillmentStatus: z
    .enum(["AWAITING_SHIPMENT", "SHIPPED", "IN_TRANSIT", "DELIVERED"])
    .optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }

    const data = parsed.data;
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const wasActive = !["CANCELLED", "REFUNDED"].includes(existing.status);
    const becomingInactive = data.status && ["CANCELLED", "REFUNDED"].includes(data.status);

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.courierName !== undefined || data.trackingNumber !== undefined || data.fulfillmentStatus
          ? {
              shipment: {
                upsert: {
                  create: {
                    courierName: data.courierName,
                    trackingNumber: data.trackingNumber,
                    status: data.fulfillmentStatus ?? "AWAITING_SHIPMENT",
                    shippedAt: data.fulfillmentStatus === "SHIPPED" ? new Date() : undefined,
                    deliveredAt: data.fulfillmentStatus === "DELIVERED" ? new Date() : undefined,
                  },
                  update: {
                    ...(data.courierName !== undefined && { courierName: data.courierName }),
                    ...(data.trackingNumber !== undefined && { trackingNumber: data.trackingNumber }),
                    ...(data.fulfillmentStatus && {
                      status: data.fulfillmentStatus,
                      ...(data.fulfillmentStatus === "SHIPPED" && { shippedAt: new Date() }),
                      ...(data.fulfillmentStatus === "DELIVERED" && { deliveredAt: new Date() }),
                    }),
                  },
                },
              },
            }
          : {}),
      },
      include: { shipment: true },
    });

    // Restore inventory if the order is being cancelled/refunded for the
    // first time (avoid double-restoring if it's already cancelled).
    if (wasActive && becomingInactive) {
      await restoreStockForOrder(id);
    }

    if (data.status === "SHIPPED") {
      await prisma.notification.create({
        data: {
          storeId: existing.storeId,
          customerId: existing.customerId,
          orderId: id,
          event: "ORDER_SHIPPED",
          channel: "IN_APP",
          message: `Order ${existing.orderNumber} has shipped.`,
        },
      });
    }
    if (data.status === "DELIVERED") {
      await prisma.notification.create({
        data: {
          storeId: existing.storeId,
          customerId: existing.customerId,
          orderId: id,
          event: "ORDER_DELIVERED",
          channel: "IN_APP",
          message: `Order ${existing.orderNumber} was delivered.`,
        },
      });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("Update order error:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
