"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatKES, formatDateTime } from "@/lib/utils";
import type { Order, OrderItem, Payment, Shipment } from "@/generated/prisma/client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type OrderRow = Order & { items: OrderItem[]; payments: Payment[]; shipment: Shipment | null };

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "destructive" | "outline"> = {
  PENDING: "outline",
  AWAITING_PAYMENT: "warning",
  PAID: "success",
  PROCESSING: "default",
  PACKED: "default",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const query = new URLSearchParams();
  if (search) query.set("q", search);
  if (status !== "ALL") query.set("status", status);

  const { data: orders, isLoading } = useSWR<OrderRow[]>(
    `/api/admin/orders?${query.toString()}`,
    fetcher
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">View and manage customer orders.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order #, name, or phone…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="AWAITING_PAYMENT">Awaiting payment</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="PACKED">Packed</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Mobile card list ── */}
      <div className="mt-6 space-y-3 lg:hidden">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-md" />
          ))}
        {!isLoading && orders?.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">No orders found.</p>
        )}
        {orders?.map((order) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="block rounded-md border border-border bg-card p-4 hover:border-clay/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono font-medium text-clay">{order.orderNumber}</span>
              <Badge variant={STATUS_VARIANT[order.status]}>{order.status.replace("_", " ")}</Badge>
            </div>
            <p className="mt-1.5 text-sm font-medium">{order.guestName}</p>
            <p className="text-xs text-muted-foreground">{order.guestPhone}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatDateTime(order.createdAt)}</span>
              <span className="font-semibold text-foreground">{formatKES(order.total)}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Desktop table ── */}
      <div className="mt-6 hidden overflow-x-auto rounded-md border border-border bg-card lg:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-bone-deep text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))}
            {!isLoading && orders?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            )}
            {orders?.map((order) => (
              <tr key={order.id} className="hover:bg-bone-deep/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-mono font-medium text-clay hover:underline">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p>{order.guestName}</p>
                  <p className="text-xs text-muted-foreground">{order.guestPhone}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                <td className="px-4 py-3">{order.items.length}</td>
                <td className="px-4 py-3 font-medium">{formatKES(order.total)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {order.payments[0]?.method === "MPESA" ? "M-Pesa" : "COD"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[order.status]}>{order.status.replace("_", " ")}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
