import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatKES, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function AccountOrdersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") {
    redirect("/login?callbackUrl=/account/orders");
  }

  const orders = await prisma.order.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold tracking-tight">Your Orders</h1>
      <div className="ruler-divider mt-4 mb-8" />

      {orders.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center text-muted-foreground">
          You haven&apos;t placed any orders yet.
          <div className="mt-4">
            <Link href="/products" className="font-semibold text-clay hover:underline">
              Start shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4 hover:border-clay"
            >
              <div>
                <p className="font-medium">#{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold">{formatKES(Number(order.total))}</p>
                <Badge variant="outline" className="mt-1 text-xs">{order.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
