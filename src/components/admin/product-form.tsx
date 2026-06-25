"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { Plus, Trash2, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { productFormSchema, type ProductFormInput } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { slugify } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ProductFormProps {
  productId?: string;
  defaultValues?: Partial<ProductFormInput>;
}

export function ProductForm({ productId, defaultValues }: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(productId);

  const { data: categories } = useSWR<{ id: string; name: string }[]>("/api/admin/categories", fetcher);
  const { data: brands } = useSWR<{ id: string; name: string }[]>("/api/admin/brands", fetcher);

  const mergedDefaults: ProductFormInput = {
    name: "",
    slug: "",
    description: "",
    sku: "",
    gender: "UNISEX",
    status: "DRAFT",
    isFeatured: false,
    costPrice: 0,
    sellingPrice: 0,
    images: [{ url: "", altText: "" }],
    variants: [{ size: "", color: "", sku: "", stock: 0 }],
    ...defaultValues,
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: mergedDefaults,
  });

  const imageArray = useFieldArray({ control, name: "images" });
  const variantArray = useFieldArray({ control, name: "variants" });

  const name = watch("name");

  function autoSlug() {
    if (name) setValue("slug", slugify(name));
  }

  async function onSubmit(data: ProductFormInput) {
    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/products/${productId}` : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          images: data.images.filter((img) => img.url.trim() !== ""),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to save product");
        setSaving(false);
        return;
      }

      toast.success(isEdit ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Product name</Label>
            <Input id="name" className="mt-1.5" {...register("name")} onBlur={autoSlug} />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" className="mt-1.5" {...register("slug")} />
            {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" className="mt-1.5 font-mono" {...register("sku")} />
            {errors.sku && <p className="mt-1 text-xs text-destructive">{errors.sku.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} className="mt-1.5" {...register("description")} />
            {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div>
            <Label>Gender</Label>
            <Select defaultValue={defaultValues?.gender ?? "UNISEX"} onValueChange={(v) => setValue("gender", v as ProductFormInput["gender"])}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEN">Men</SelectItem>
                <SelectItem value="WOMEN">Women</SelectItem>
                <SelectItem value="KIDS">Kids</SelectItem>
                <SelectItem value="UNISEX">Unisex</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select defaultValue={defaultValues?.status ?? "DRAFT"} onValueChange={(v) => setValue("status", v as ProductFormInput["status"])}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select defaultValue={defaultValues?.categoryId} onValueChange={(v) => setValue("categoryId", v)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Brand</Label>
            <Select defaultValue={defaultValues?.brandId} onValueChange={(v) => setValue("brandId", v)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox id="isFeatured" checked={watch("isFeatured")} onCheckedChange={(c) => setValue("isFeatured", !!c)} />
            <Label htmlFor="isFeatured" className="font-normal normal-case">Feature on homepage</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="costPrice">Cost price (KES)</Label>
            <Input id="costPrice" type="number" step="0.01" className="mt-1.5" {...register("costPrice", { valueAsNumber: true })} />
          </div>
          <div>
            <Label htmlFor="sellingPrice">Selling price (KES)</Label>
            <Input id="sellingPrice" type="number" step="0.01" className="mt-1.5" {...register("sellingPrice", { valueAsNumber: true })} />
            {errors.sellingPrice && <p className="mt-1 text-xs text-destructive">{errors.sellingPrice.message}</p>}
          </div>
          <div>
            <Label htmlFor="discountPrice">Discount price (optional)</Label>
            <Input id="discountPrice" type="number" step="0.01" className="mt-1.5" {...register("discountPrice", { valueAsNumber: true })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {imageArray.fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                placeholder="https://...jpg"
                {...register(`images.${index}.url`)}
              />
              <Input
                placeholder="Alt text (optional)"
                className="max-w-[200px]"
                {...register(`images.${index}.altText`)}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => imageArray.remove(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => imageArray.append({ url: "", altText: "" })}>
            <ImagePlus className="h-4 w-4" /> Add image URL
          </Button>
          <p className="text-xs text-muted-foreground">
            Paste image URLs for now (e.g. from a CDN). Direct upload to R2/S3 can be wired in later.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Size &amp; color variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {errors.variants?.message && <p className="text-xs text-destructive">{errors.variants.message}</p>}
          {variantArray.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2">
              <Input placeholder="Size (e.g. 42)" className="col-span-3" {...register(`variants.${index}.size`)} />
              <Input placeholder="Color" className="col-span-3" {...register(`variants.${index}.color`)} />
              <Input placeholder="Variant SKU" className="col-span-3 font-mono" {...register(`variants.${index}.sku`)} />
              <Input
                placeholder="Stock"
                type="number"
                className="col-span-2"
                {...register(`variants.${index}.stock`, { valueAsNumber: true })}
              />
              <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => variantArray.remove(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => variantArray.append({ size: "", color: "", sku: "", stock: 0 })}
          >
            <Plus className="h-4 w-4" /> Add variant
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
