"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const ORDER_STATUSES = [
  "PENDING", "AWAITING_PAYMENT", "PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED",
];

const FULFILLMENT_STATUSES = ["AWAITING_SHIPMENT", "SHIPPED", "IN_TRANSIT", "DELIVERED"];

export function AdminOrderActions({
  orderId,
  currentStatus,
  currentCourier,
  currentTracking,
  currentFulfillment,
}: {
  orderId: string;
  currentStatus: string;
  currentCourier?: string | null;
  currentTracking?: string | null;
  currentFulfillment?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [courierName, setCourierName] = useState(currentCourier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(currentTracking ?? "");
  const [fulfillmentStatus, setFulfillmentStatus] = useState(currentFulfillment ?? "AWAITING_SHIPMENT");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, courierName, trackingNumber, fulfillmentStatus }),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to update order");
        setSaving(false);
        return;
      }

      toast.success("Order updated");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Order status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(status === "CANCELLED" || status === "REFUNDED") && currentStatus !== status && (
            <p className="mt-1.5 text-xs text-clay">Stock will be restored for this order&apos;s items.</p>
          )}
        </div>

        <div>
          <Label>Fulfillment status</Label>
          <Select value={fulfillmentStatus} onValueChange={setFulfillmentStatus}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FULFILLMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Courier name</Label>
          <Input className="mt-1.5" value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. G4S, Wells Fargo" />
        </div>

        <div>
          <Label>Tracking number</Label>
          <Input className="mt-1.5 font-mono" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
        </div>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
