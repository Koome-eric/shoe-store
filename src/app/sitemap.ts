import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getStoreId } from "@/lib/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let storeId: string;
  try {
    storeId = await getStoreId();
  } catch {
    // DB unreachable at build time — fall back to static routes only.
    return [
      { url: baseUrl, changeFrequency: "daily", priority: 1 },
      { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    ];
  }

  const products = await prisma.product.findMany({
    where: { storeId, status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
  });

  const categories = await prisma.category.findMany({
    where: { storeId },
    select: { slug: true },
  });

  return [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({
      url: `${baseUrl}/products?category=${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
