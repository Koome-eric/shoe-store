import { z } from "zod";
import { isValidKenyanPhone } from "@/lib/utils";

export const kenyanPhoneSchema = z
  .string()
  .min(9, "Enter a valid phone number")
  .refine(isValidKenyanPhone, "Enter a valid Kenyan phone number (e.g. 0712 345 678)");

export const checkoutSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  phone: kenyanPhoneSchema,
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  county: z.string().min(2, "Select a county"),
  town: z.string().min(2, "Enter your town"),
  street: z.string().min(3, "Enter your street / building / landmark"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["MPESA", "CASH_ON_DELIVERY"]),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string(),
        productName: z.string(),
        size: z.string(),
        color: z.string(),
        unitPrice: z.number().positive(),
        quantity: z.number().int().positive(),
        image: z.string().optional(),
      })
    )
    .min(1, "Your cart is empty"),
  couponCode: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    phone: kenyanPhoneSchema,
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  phone: kenyanPhoneSchema,
  password: z.string().min(1, "Enter your password"),
});

export const stkPushSchema = z.object({
  orderId: z.string(),
  phone: kenyanPhoneSchema,
});

export const productFormSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().min(10, "Add a longer description"),
  sku: z.string().min(2, "SKU is required"),
  gender: z.enum(["MEN", "WOMEN", "KIDS", "UNISEX"]),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().positive(),
  discountPrice: z.number().positive().optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  isFeatured: z.boolean().optional(),
  images: z.array(z.object({ url: z.string().url(), altText: z.string().optional() })),
  variants: z
    .array(
      z.object({
        size: z.string().min(1),
        color: z.string().min(1),
        sku: z.string().min(1),
        stock: z.number().int().nonnegative(),
      })
    )
    .min(1, "Add at least one size/color variant"),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;
