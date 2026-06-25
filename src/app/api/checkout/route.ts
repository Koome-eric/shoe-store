import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validations/schemas";
import { prisma } from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { decrementStockForOrder, InsufficientStockError } from "@/lib/inventory";
import { generateOrderNumber, normalizeKenyanPhone } from "@/lib/utils";
import { auth } from "@/lib/auth";

// Flat shipping fee for now — Phase 2 can make this county/weight based.
const SHIPPING_FEE = 250;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout data", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const storeId = await getStoreId();
    const session = await auth();
    const phone = normalizeKenyanPhone(data.phone);

    const subtotal = data.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    // Validate + apply coupon if provided.
    let discount = 0;
    let couponId: string | null = null;
    let shippingFee = SHIPPING_FEE;

    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { storeId_code: { storeId, code: data.couponCode.toUpperCase() } },
      });

      if (coupon && coupon.isActive) {
        const notExpired = !coupon.expiresAt || coupon.expiresAt > new Date();
        const underLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
        const meetsMin = !coupon.minOrderValue || subtotal >= Number(coupon.minOrderValue);

        if (notExpired && underLimit && meetsMin) {
          couponId = coupon.id;
          if (coupon.type === "PERCENTAGE") {
            discount = subtotal * (Number(coupon.value) / 100);
          } else if (coupon.type === "FIXED") {
            discount = Math.min(Number(coupon.value), subtotal);
          } else if (coupon.type === "FREE_SHIPPING") {
            shippingFee = 0;
          }
        }
      }
    }

    const total = Math.max(0, subtotal - discount) + shippingFee;

    const order = await prisma.$transaction(async (tx) => {
      await decrementStockForOrder(
        tx,
        data.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          productName: i.productName,
          size: i.size,
        }))
      );

      const created = await tx.order.create({
        data: {
          storeId,
          orderNumber: generateOrderNumber(),
          customerId: session?.user?.role === "CUSTOMER" ? session.user.id : null,
          guestName: data.fullName,
          guestPhone: phone,
          guestEmail: data.email || null,
          county: data.county,
          town: data.town,
          street: data.street,
          status: data.paymentMethod === "MPESA" ? "AWAITING_PAYMENT" : "PENDING",
          subtotal,
          shippingFee,
          discount,
          total,
          couponId,
          notes: data.notes,
          items: {
            create: data.items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              productName: i.productName,
              size: i.size,
              color: i.color,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
            })),
          },
          payments: {
            create: {
              method: data.paymentMethod,
              status: "PENDING",
              amount: total,
              phoneNumber: phone,
            },
          },
          shipment: {
            create: { status: "AWAITING_SHIPMENT" },
          },
        },
        include: { payments: true },
      });

      if (couponId) {
        await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      }

      await tx.notification.create({
        data: {
          storeId,
          customerId: created.customerId,
          orderId: created.id,
          event: "ORDER_CREATED",
          channel: "IN_APP",
          message: `Order ${created.orderNumber} placed — ${data.paymentMethod === "MPESA" ? "awaiting M-Pesa payment" : "cash on delivery"}.`,
        },
      });

      return created;
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total,
      paymentId: order.payments[0]?.id,
    });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Something went wrong placing your order. Please try again." }, { status: 500 });
  }
}
