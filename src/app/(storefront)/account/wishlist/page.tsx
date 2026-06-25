import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/product-card";

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") {
    redirect("/login?callbackUrl=/account/wishlist");
  }

  const items = await prisma.wishlistItem.findMany({
    where: { customerId: session.user.id },
    include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true, brand: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold tracking-tight">Your Wishlist</h1>
      <div className="ruler-divider mt-4 mb-8" />

      {items.length === 0 ? (
        <p className="text-muted-foreground">Nothing saved yet — tap the heart icon on any product to add it here.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
