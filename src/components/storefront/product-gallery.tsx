"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-md bg-bone-deep">
        {current ? (
          <Image
            src={current.url}
            alt={current.altText || productName}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No image available</div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-sm bg-bone-deep ring-2 ring-offset-2 ring-offset-bone transition-all",
                active === i ? "ring-clay" : "ring-transparent"
              )}
            >
              <Image src={img.url} alt={img.altText || productName} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
