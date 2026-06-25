import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold tracking-tight">Add Product</h1>
      <p className="mt-1 text-sm text-muted-foreground">Create a new product with sizes, colors, and stock.</p>
      <div className="mt-6">
        <ProductForm />
      </div>
    </div>
  );
}
