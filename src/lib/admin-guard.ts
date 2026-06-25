import { auth } from "@/lib/auth";

const ADMIN_ROLES = new Set(["ADMIN", "STAFF", "SUPER_ADMIN"]);

/** Returns the session if the caller is an authenticated admin/staff user, else null. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.has(session.user.role)) {
    return null;
  }
  return session;
}
