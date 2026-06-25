import { AdminDashboardStats } from "@/components/admin/admin-dashboard-stats";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">An overview of your store&apos;s performance.</p>
      <div className="mt-6">
        <AdminDashboardStats />
      </div>
    </div>
  );
}
