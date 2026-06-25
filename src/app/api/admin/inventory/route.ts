import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter"); // "low" | "out" | undefined

  const storeId = await getStoreId();

  const variants = await prisma.productVariant.findMany({
    where: {
      product: { storeId },
      ...(filter === "out" ? { stock: 0 } : {}),
      ...(filter === "low" ? { stock: { gt: 0 } } : {}),
    },
    include: {
      product: { select: { id: true, name: true, slug: true, images: { take: 1, orderBy: { position: "asc" } } } },
    },
    orderBy: { stock: "asc" },
  });

  const filtered =
    filter === "low" ? variants.filter((v) => v.stock <= v.lowStockThreshold) : variants;

  return NextResponse.json(filtered);
}

const adjustSchema = z.object({
  variantId: z.string(),
  change: z.number().int(),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = adjustSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { variantId, change, reason } = parsed.data;

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });

  if (variant.stock + change < 0) {
    return NextResponse.json({ error: "Adjustment would result in negative stock" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const v = await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: change } },
    });
    await tx.inventoryMovement.create({
      data: {
        variantId,
        type: change >= 0 ? "RESTOCK" : "ADJUSTMENT",
        change,
        reason: reason || (change >= 0 ? "Manual restock" : "Manual adjustment"),
      },
    });
    return v;
  });

  return NextResponse.json(updated);
}
