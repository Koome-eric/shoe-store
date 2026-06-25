import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { productFormSchema } from "@/lib/validations/schemas";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } }, variants: true, category: true, brand: true },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = productFormSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Images and variants are replaced wholesale on edit — simpler and
    // safer than diffing, and the admin UI always sends the full list.
    const product = await prisma.$transaction(async (tx) => {
      if (data.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
      }
      if (data.variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.sku !== undefined && { sku: data.sku }),
          ...(data.gender !== undefined && { gender: data.gender }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
          ...(data.brandId !== undefined && { brandId: data.brandId || null }),
          ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
          ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
          ...(data.discountPrice !== undefined && { discountPrice: data.discountPrice || null }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
          ...(data.images && {
            images: { create: data.images.map((img, i) => ({ url: img.url, altText: img.altText, position: i })) },
          }),
          ...(data.variants && {
            variants: {
              create: data.variants.map((v) => ({ size: v.size, color: v.color, sku: v.sku, stock: v.stock })),
            },
          }),
        },
        include: { images: true, variants: true },
      });
    });

    return NextResponse.json(product);
  } catch (err) {
    console.error("Update product error:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    // Likely a foreign key restriction from existing order items — archive
    // instead of hard-deleting so order history stays intact.
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    return NextResponse.json({ ok: true, archived: true });
  }
}
