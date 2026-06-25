import Link from "next/link";
import Image from "next/image";
import type { Product, ProductImage, ProductVariant, Brand } from "@/generated/prisma/client";
import { formatKES } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type ProductWithRelations = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
  brand: Brand | null;
};

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const isOutOfStock = totalStock === 0;
  const hasDiscount = product.discountPrice && Number(product.discountPrice) < Number(product.sellingPrice);
  const image = product.images[0];

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-md bg-bone-deep">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText || product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
        )}

        {hasDiscount && (
          <Badge variant="clay" className="absolute left-3 top-3 bg-clay text-bone">
            Sale
          </Badge>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
            <Badge variant="outline" className="border-bone bg-ink/80 text-bone">
              Out of stock
            </Badge>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-0.5">
        {product.brand && (
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{product.brand.name}</p>
        )}
        <h3 className="font-medium text-foreground line-clamp-1">{product.name}</h3>
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="font-display font-bold text-foreground">
            {formatKES(hasDiscount ? product.discountPrice! : product.sellingPrice)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">{formatKES(product.sellingPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
