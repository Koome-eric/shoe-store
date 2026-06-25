import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const KES_FORMATTER = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

// Prisma returns Decimal objects for numeric DB columns. Accepting
// { toNumber(): number } here covers Decimal without importing the type.
export function formatKES(amount: number | string | { toNumber(): number }) {
  const value =
    typeof amount === "number"
      ? amount
      : typeof amount === "string"
      ? parseFloat(amount)
      : amount.toNumber();
  return KES_FORMATTER.format(value);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** Generates a human-friendly order number, e.g. SS-7F3K9D */
export function generateOrderNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SS-${code}`;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normalizes a Kenyan phone number to the 2547XXXXXXXX format Daraja expects */
export function normalizeKenyanPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "254" + digits.slice(1);
  } else if (digits.startsWith("7") || digits.startsWith("1")) {
    digits = "254" + digits;
  } else if (digits.startsWith("+254")) {
    digits = digits.slice(1);
  }
  return digits;
}

export function isValidKenyanPhone(phone: string): boolean {
  const normalized = normalizeKenyanPhone(phone);
  return /^254(7|1)\d{8}$/.test(normalized);
}

/** Builds a wa.me link with a prefilled message, used for "Order via WhatsApp" CTAs. */
export function buildWhatsAppLink(message: string, phone?: string) {
  const number = phone || process.env.NEXT_PUBLIC_STORE_WHATSAPP || "254700000000";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
