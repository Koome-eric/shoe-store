import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { requireAdmin } from "@/lib/admin-guard";
import type { OrderStatus } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const storeId = await getStoreId();

  const orders = await prisma.order.findMany({
    where: {
      storeId,
      ...(status ? { status: status as OrderStatus } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" } },
              { guestName: { contains: q, mode: "insensitive" } },
              { guestPhone: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      shipment: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(orders);
}
