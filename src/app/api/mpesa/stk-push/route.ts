import { NextResponse } from "next/server";
import { stkPushSchema } from "@/lib/validations/schemas";
import { prisma } from "@/lib/prisma";
import { initiateStkPush } from "@/lib/mpesa";
import { normalizeKenyanPhone } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = stkPushSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { orderId } = parsed.data;
    const phone = normalizeKenyanPhone(parsed.data.phone);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const payment = order.payments.find((p) => p.method === "MPESA" && p.status === "PENDING");
    if (!payment) {
      return NextResponse.json({ error: "No pending M-Pesa payment found for this order" }, { status: 400 });
    }

    let stkResponse;
    try {
      stkResponse = await initiateStkPush({
        phone,
        amount: Number(order.total),
        accountReference: order.orderNumber,
        description: "Savanna Sole",
      });
    } catch (mpesaError) {
      // Common during development before Daraja credentials are configured —
      // surface a clear message instead of a raw stack trace.
      const message =
        mpesaError instanceof Error ? mpesaError.message : "Failed to reach M-Pesa";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        merchantRequestId: stkResponse.MerchantRequestID,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        phoneNumber: phone,
      },
    });

    return NextResponse.json({
      checkoutRequestId: stkResponse.CheckoutRequestID,
      message: stkResponse.CustomerMessage,
    });
  } catch (err) {
    console.error("STK push error:", err);
    return NextResponse.json({ error: "Failed to initiate M-Pesa payment" }, { status: 500 });
  }
}
