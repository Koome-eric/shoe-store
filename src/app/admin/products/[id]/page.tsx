import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } }, variants: true },
  });

  if (!product) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold tracking-tight">Edit Product</h1>
      <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>
      <div className="mt-6">
        <ProductForm
          productId={product.id}
          defaultValues={{
            name: product.name,
            slug: product.slug,
            description: product.description,
            sku: product.sku,
            gender: product.gender,
            categoryId: product.categoryId ?? undefined,
            brandId: product.brandId ?? undefined,
            costPrice: Number(product.costPrice),
            sellingPrice: Number(product.sellingPrice),
            discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
            status: product.status,
            isFeatured: product.isFeatured,
            images: product.images.map((img) => ({ url: img.url, altText: img.altText ?? "" })),
            variants: product.variants.map((v) => ({ size: v.size, color: v.color, sku: v.sku, stock: v.stock })),
          }}
        />
      </div>
    </div>
  );
}
