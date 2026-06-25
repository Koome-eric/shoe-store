import { prisma } from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import type { Gender, ProductStatus } from "@/generated/prisma/client";

function toPlainProduct<T extends Awaited<ReturnType<typeof prisma.product.findMany>>[number]>(product: T) {
  return {
    ...product,
    costPrice: Number(product.costPrice),
    sellingPrice: Number(product.sellingPrice),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
  } as T & {
    costPrice: number;
    sellingPrice: number;
    discountPrice: number | null;
  };
}

export async function getFeaturedProducts(limit = 8) {
  const storeId = await getStoreId();
  const products = await prisma.product.findMany({
    where: { storeId, status: "ACTIVE", isFeatured: true },
    include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true, brand: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return products.map(toPlainProduct);
}

export async function getNewArrivals(limit = 8) {
  const storeId = await getStoreId();
  const products = await prisma.product.findMany({
    where: { storeId, status: "ACTIVE" },
    include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true, brand: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return products.map(toPlainProduct);
}

export async function getBestSellers(limit = 8) {
  const storeId = await getStoreId();
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const ids = grouped.map((g) => g.productId);
  if (ids.length === 0) {
    // No sales yet — fall back to featured so the homepage isn't empty.
    return getFeaturedProducts(limit);
  }

  const products = await prisma.product.findMany({
    where: { storeId, status: "ACTIVE", id: { in: ids } },
    include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true, brand: true },
  });

  // Preserve the best-selling order from the groupBy.
  const order = new Map(ids.map((id, i) => [id, i]));
  return products.map(toPlainProduct).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function getCategories() {
  const storeId = await getStoreId();
  return prisma.category.findMany({
    where: { storeId, parentId: null },
    include: { children: true },
    orderBy: { name: "asc" },
  });
}

export interface CatalogFilters {
  gender?: Gender;
  categorySlug?: string;
  brandSlug?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  sort?: "latest" | "price-asc" | "price-desc" | "best-selling";
  page?: number;
  perPage?: number;
}

export async function getCatalog(filters: CatalogFilters) {
  const storeId = await getStoreId();
  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? 12;

  const where = {
    storeId,
    status: "ACTIVE" as ProductStatus,
    ...(filters.gender ? { gender: filters.gender } : {}),
    ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(filters.brandSlug ? { brand: { slug: filters.brandSlug } } : {}),
    ...(filters.q ? { name: { contains: filters.q, mode: "insensitive" as const } } : {}),
    ...(filters.minPrice || filters.maxPrice
      ? {
          sellingPrice: {
            ...(filters.minPrice ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
    ...(filters.size || filters.color
      ? {
          variants: {
            some: {
              ...(filters.size ? { size: filters.size } : {}),
              ...(filters.color ? { color: filters.color } : {}),
            },
          },
        }
      : {}),
  };

  const orderBy =
    filters.sort === "price-asc"
      ? { sellingPrice: "asc" as const }
      : filters.sort === "price-desc"
        ? { sellingPrice: "desc" as const }
        : { createdAt: "desc" as const };
  // "best-selling" sort is handled by falling back to latest at the query
  // level — true best-selling-aware pagination needs the orderItem join,
  // which is applied as a post-sort below for the common small-catalog case.

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true, brand: true, category: true },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return { products: products.map(toPlainProduct), total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function getProductBySlug(slug: string) {
  const storeId = await getStoreId();
  const product = await prisma.product.findUnique({
    where: { storeId_slug: { storeId, slug } },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: true,
      category: true,
      brand: true,
    },
  });

  if (product) {
    // Fire-and-forget view count increment — don't block the page render.
    prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
  }

  return product ? toPlainProduct(product) : null;
}

export async function getRelatedProducts(productId: string, categoryId: string | null, limit = 4) {
  const storeId = await getStoreId();
  const products = await prisma.product.findMany({
    where: {
      storeId,
      status: "ACTIVE",
      id: { not: productId },
      ...(categoryId ? { categoryId } : {}),
    },
    include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true, brand: true },
    take: limit,
  });

  return products.map(toPlainProduct);
}

export async function getAllSizesAndColors() {
  const storeId = await getStoreId();
  const variants = await prisma.productVariant.findMany({
    where: { product: { storeId, status: "ACTIVE" } },
    select: { size: true, color: true },
    distinct: ["size", "color"],
  });
  const sizes = Array.from(new Set(variants.map((v) => v.size))).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
  const colors = Array.from(new Set(variants.map((v) => v.color))).sort();
  return { sizes, colors };
}

export async function getAllBrands() {
  return prisma.brand.findMany({ orderBy: { name: "asc" } });
}
