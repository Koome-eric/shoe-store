import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMpesaCallback, type MpesaCallbackBody } from "@/lib/mpesa";

/**
 * Daraja POSTs here once the customer has responded to the STK prompt
 * (entered PIN, cancelled, or it timed out). We must always respond with
 * HTTP 200 and ResultCode 0 — Daraja retries on anything else, which would
 * otherwise cause duplicate-processing headaches.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MpesaCallbackBody;
    const result = parseMpesaCallback(body);

    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId: result.checkoutRequestId },
      include: { order: true },
    });

    if (!payment) {
      // Unknown checkout request — acknowledge anyway so Daraja stops retrying.
      console.warn("M-Pesa callback for unknown payment:", result.checkoutRequestId);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const isSuccess = result.resultCode === 0;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccess ? "PAID" : "FAILED",
          resultCode: result.resultCode,
          resultDesc: result.resultDesc,
          mpesaReceiptNumber: result.mpesaReceiptNumber,
          transactionDate: result.transactionDate,
          rawCallback: body as unknown as object,
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: isSuccess ? "PAID" : "AWAITING_PAYMENT" },
      });

      await tx.notification.create({
        data: {
          storeId: payment.order.storeId,
          customerId: payment.order.customerId,
          orderId: payment.orderId,
          event: "PAYMENT_RECEIVED",
          channel: "IN_APP",
          message: isSuccess
            ? `Payment of KES ${result.amount} received for order ${payment.order.orderNumber}.`
            : `Payment for order ${payment.order.orderNumber} failed: ${result.resultDesc}`,
        },
      });
    });

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    // Still acknowledge — Daraja will keep retrying a failed-looking response
    // and we don't want a transient DB hiccup to cause a callback storm.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
