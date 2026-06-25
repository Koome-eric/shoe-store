import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export class InsufficientStockError extends Error {
  constructor(public productName: string, public size: string, public available: number) {
    super(`Only ${available} left of ${productName} (size ${size})`);
    this.name = "InsufficientStockError";
  }
}

/**
 * Atomically decrements stock for each cart line and records the movement.
 * Throws InsufficientStockError if any line would go negative — the whole
 * transaction rolls back, so partial stock decrements never happen.
 */
export async function decrementStockForOrder(
  tx: Prisma.TransactionClient,
  lines: { variantId: string; quantity: number; productName: string; size: string }[]
) {
  for (const line of lines) {
    const variant = await tx.productVariant.findUnique({ where: { id: line.variantId } });
    if (!variant || variant.stock < line.quantity) {
      throw new InsufficientStockError(line.productName, line.size, variant?.stock ?? 0);
    }

    await tx.productVariant.update({
      where: { id: line.variantId },
      data: { stock: { decrement: line.quantity } },
    });

    await tx.inventoryMovement.create({
      data: {
        variantId: line.variantId,
        type: "SALE",
        change: -line.quantity,
        reason: "Order placed",
      },
    });
  }
}

/** Restores stock for a cancelled/refunded order's line items. */
export async function restoreStockForOrder(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          variantId: item.variantId,
          type: "RETURN",
          change: item.quantity,
          reason: "Order cancelled",
        },
      });
    }
  });
}
