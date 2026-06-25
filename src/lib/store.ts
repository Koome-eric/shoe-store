import { prisma } from "@/lib/prisma";

const STORE_SLUG = "savanna-sole";

let cachedStoreId: string | null = null;

/**
 * Returns the id of the (currently single) store row, creating it if it
 * doesn't exist yet. Cached in-process since there's only ever one store
 * today — once this becomes multi-tenant, callers should resolve storeId
 * from the request's host/subdomain instead of calling this.
 */
export async function getStoreId(): Promise<string> {
  if (cachedStoreId) return cachedStoreId;

  const store = await prisma.store.upsert({
    where: { slug: STORE_SLUG },
    update: {},
    create: {
      name: process.env.NEXT_PUBLIC_STORE_NAME || "Savanna & Sole",
      slug: STORE_SLUG,
      currency: "KES",
      whatsapp: process.env.STORE_WHATSAPP_NUMBER,
    },
  });

  cachedStoreId = store.id;
  return store.id;
}
