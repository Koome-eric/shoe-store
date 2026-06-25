"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { CatalogFilterSidebar } from "./catalog-filter-sidebar";

interface Props {
  sizes: string[];
  colors: string[];
  brands: { id: string; name: string; slug: string }[];
  children: React.ReactNode;
}

export function MobileFilterDrawer({ sizes, colors, brands, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* backdrop */}
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          {/* panel */}
          <aside className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Filters</h2>
              <button onClick={() => setOpen(false)} className="rounded-sm p-1 hover:bg-ink/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CatalogFilterSidebar sizes={sizes} colors={colors} brands={brands} />
          </aside>
        </div>
      )}
    </>
  );
}
