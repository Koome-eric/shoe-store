import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, MapPin, Heart } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatKES, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "CUSTOMER") {
    redirect("/login?callbackUrl=/account");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.user.id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 5 },
      _count: { select: { orders: true, wishlistItems: true } },
    },
  });

  if (!customer) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold tracking-tight">Hi, {customer.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{customer.phone}{customer.email ? ` · ${customer.email}` : ""}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/account/orders" className="rounded-md border border-border p-5 hover:border-clay">
          <Package className="h-5 w-5 text-clay" />
          <p className="mt-3 font-display text-xl font-bold">{customer._count.orders}</p>
          <p className="text-sm text-muted-foreground">Orders</p>
        </Link>
        <Link href="/account/wishlist" className="rounded-md border border-border p-5 hover:border-clay">
          <Heart className="h-5 w-5 text-clay" />
          <p className="mt-3 font-display text-xl font-bold">{customer._count.wishlistItems}</p>
          <p className="text-sm text-muted-foreground">Wishlist items</p>
        </Link>
        <div className="rounded-md border border-border p-5">
          <MapPin className="h-5 w-5 text-clay" />
          <p className="mt-3 text-sm text-muted-foreground">Manage delivery addresses from checkout</p>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-clay hover:underline">
            View all
          </Link>
        </div>
        <div className="ruler-divider mt-3 mb-6" />
        {customer.orders.length === 0 ? (
          <p className="text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {customer.orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between rounded-md border border-border p-4 hover:border-clay"
              >
                <div>
                  <p className="font-medium">#{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
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
    </div>
  );
}
