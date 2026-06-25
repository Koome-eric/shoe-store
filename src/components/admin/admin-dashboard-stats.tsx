"use client";

import useSWR from "swr";
import { TrendingUp, ShoppingCart, Users, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKES } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DashboardData {
  revenue: { today: number; week: number; month: number; year: number };
  orders: { pending: number; paid: number; shipped: number };
  customers: { total: number; newThisMonth: number };
  inventory: { lowStock: number; outOfStock: number };
  bestSellers: { productId: string; name: string; unitsSold: number }[];
  mostViewed: { id: string; name: string; viewCount: number; slug: string }[];
}

export function AdminDashboardStats() {
  const { data, isLoading } = useSWR<DashboardData>("/api/admin/dashboard", fetcher);

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue today</CardTitle>
            <TrendingUp className="h-4 w-4 text-clay" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold">{formatKES(data.revenue.today)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatKES(data.revenue.month)} this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders pending</CardTitle>
            <ShoppingCart className="h-4 w-4 text-clay" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold">{data.orders.pending}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.orders.paid} paid · {data.orders.shipped} shipped
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
            <Users className="h-4 w-4 text-clay" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold">{data.customers.total}</p>
            <p className="mt-1 text-xs text-muted-foreground">+{data.customers.newThisMonth} this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-clay" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold">{data.inventory.lowStock + data.inventory.outOfStock}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.inventory.outOfStock} out · {data.inventory.lowStock} low
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Best sellers</CardTitle>
          </CardHeader>
          <CardContent>
            {data.bestSellers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.bestSellers.map((p, i) => (
                  <li key={p.productId} className="flex items-center justify-between text-sm">
                    <span>{i + 1}. {p.name}</span>
                    <span className="font-medium text-muted-foreground">{p.unitsSold} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most viewed products</CardTitle>
          </CardHeader>
          <CardContent>
            {data.mostViewed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.mostViewed.map((p, i) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span>{i + 1}. {p.name}</span>
                    <span className="font-medium text-muted-foreground">{p.viewCount} views</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
