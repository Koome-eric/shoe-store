import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { requireAdmin } from "@/lib/admin-guard";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function startOfWeek(d: Date) {
  const copy = startOfDay(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  return copy;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = await getStoreId();
  const now = new Date();

  const paidRevenue = async (since: Date) =>
    prisma.order
      .aggregate({
        where: { storeId, status: { in: ["PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"] }, createdAt: { gte: since } },
        _sum: { total: true },
      })
      .then((r) => Number(r._sum.total ?? 0));

  const [revenueToday, revenueWeek, revenueMonth, revenueYear] = await Promise.all([
    paidRevenue(startOfDay(now)),
    paidRevenue(startOfWeek(now)),
    paidRevenue(startOfMonth(now)),
    paidRevenue(startOfYear(now)),
  ]);

  const [pendingOrders, paidOrders, shippedOrders] = await Promise.all([
    prisma.order.count({ where: { storeId, status: { in: ["PENDING", "AWAITING_PAYMENT"] } } }),
    prisma.order.count({ where: { storeId, status: "PAID" } }),
    prisma.order.count({ where: { storeId, status: "SHIPPED" } }),
  ]);

  const totalCustomers = await prisma.customer.count({ where: { storeId } });
  const newCustomersThisMonth = await prisma.customer.count({
    where: { storeId, createdAt: { gte: startOfMonth(now) } },
  });

  const variants = await prisma.productVariant.findMany({
    where: { product: { storeId } },
    select: { stock: true, lowStockThreshold: true },
  });
  const lowStockCount = variants.filter((v) => v.stock > 0 && v.stock <= v.lowStockThreshold).length;
  const outOfStockCount = variants.filter((v) => v.stock === 0).length;

  const bestSellers = await prisma.orderItem.groupBy({
    by: ["productId", "productName"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const mostViewed = await prisma.product.findMany({
    where: { storeId },
    select: { id: true, name: true, viewCount: true, slug: true },
    orderBy: { viewCount: "desc" },
    take: 5,
  });

  return NextResponse.json({
    revenue: { today: revenueToday, week: revenueWeek, month: revenueMonth, year: revenueYear },
    orders: { pending: pendingOrders, paid: paidOrders, shipped: shippedOrders },
    customers: { total: totalCustomers, newThisMonth: newCustomersThisMonth },
    inventory: { lowStock: lowStockCount, outOfStock: outOfStockCount },
    bestSellers: bestSellers.map((b) => ({
      productId: b.productId,
      name: b.productName,
      unitsSold: b._sum.quantity ?? 0,
    })),
    mostViewed,
  });
}
