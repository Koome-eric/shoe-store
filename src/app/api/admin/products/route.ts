import { NextResponse } from "next/server";
import { productFormSchema } from "@/lib/validations/schemas";
import { prisma } from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const storeId = await getStoreId();

  const products = await prisma.product.findMany({
    where: {
      storeId,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(status ? { status: status as "DRAFT" | "ACTIVE" | "ARCHIVED" } : {}),
    },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: true,
      category: true,
      brand: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = productFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const storeId = await getStoreId();

    const existingSlug = await prisma.product.findUnique({
      where: { storeId_slug: { storeId, slug: data.slug } },
    });
    if (existingSlug) {
      return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
    }

    const product = await prisma.product.create({
      data: {
        storeId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        sku: data.sku,
        gender: data.gender,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        discountPrice: data.discountPrice || null,
        status: data.status,
        isFeatured: data.isFeatured,
        images: {
          create: data.images.map((img, i) => ({ url: img.url, altText: img.altText, position: i })),
        },
        variants: {
          create: data.variants.map((v) => ({
            size: v.size,
            color: v.color,
            sku: v.sku,
            stock: v.stock,
          })),
        },
      },
      include: { images: true, variants: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("Create product error:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
