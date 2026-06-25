import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Polled by the checkout page while waiting for the customer to enter their PIN. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      orderNumber: true,
      payments: {
        select: { status: true, resultDesc: true, method: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    orderStatus: order.status,
    orderNumber: order.orderNumber,
    paymentStatus: order.payments[0]?.status ?? "PENDING",
    resultDesc: order.payments[0]?.resultDesc ?? null,
  });
}
