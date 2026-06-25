import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

const ADMIN_ROLES = new Set(["ADMIN", "STAFF", "SUPER_ADMIN"]);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || !ADMIN_ROLES.has(session.user.role)) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-bone-deep font-sans">
      <AdminSidebar userName={session.user.name || session.user.email || "Admin"} />
      {/* pt-14 on mobile to clear the fixed top bar; lg:pt-0 because sidebar is side-by-side */}
      <main className="flex-1 overflow-y-auto p-4 pt-[4.5rem] sm:p-6 lg:p-8 lg:pt-8">
        {children}
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
