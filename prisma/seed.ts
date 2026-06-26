/**
 * Seed script — populates a fresh database with a store, an admin login,
 * a few brands/categories, and a handful of sample products so the
 * storefront and admin dashboard aren't empty on first run.
 *
 * Run with: npx tsx prisma/seed.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const store = await prisma.store.upsert({
    where: { slug: "savanna-sole" },
    update: {},
    create: {
      name: "Savanna & Sole",
      slug: "savanna-sole",
      currency: "KES",
      whatsapp: process.env.STORE_WHATSAPP_NUMBER || "254710570935",
      email: "hello@savannasole.co.ke",
    },
  });

  const adminPasswordHash = await bcrypt.hash("Admin1234!", 10);
  await prisma.user.upsert({
    where: { email: "admin@savannasole.co.ke" },
    update: {},
    create: {
      storeId: store.id,
      name: "Store Admin",
      email: "admin@savannasole.co.ke",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Admin login -> admin@savannasole.co.ke / Admin1234!");

  const [men, women, kids] = await Promise.all([
    prisma.category.upsert({
      where: { storeId_slug: { storeId: store.id, slug: "men" } },
      update: {},
      create: { storeId: store.id, name: "Men", slug: "men" },
    }),
    prisma.category.upsert({
      where: { storeId_slug: { storeId: store.id, slug: "women" } },
      update: {},
      create: { storeId: store.id, name: "Women", slug: "women" },
    }),
    prisma.category.upsert({
      where: { storeId_slug: { storeId: store.id, slug: "kids" } },
      update: {},
      create: { storeId: store.id, name: "Kids", slug: "kids" },
    }),
  ]);

  await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "mens-sneakers" } },
    update: {},
    create: { storeId: store.id, name: "Sneakers", slug: "mens-sneakers", parentId: men.id },
  });
  await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "womens-heels" } },
    update: {},
    create: { storeId: store.id, name: "Heels", slug: "womens-heels", parentId: women.id },
  });
  await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "school-shoes" } },
    update: {},
    create: { storeId: store.id, name: "School Shoes", slug: "school-shoes", parentId: kids.id },
  });

  const brandNames = ["Nike", "Adidas", "Puma", "Bata", "Sebago"];
  const brands = await Promise.all(
    brandNames.map((name) =>
      prisma.brand.upsert({
        where: { slug: name.toLowerCase() },
        update: {},
        create: { name, slug: name.toLowerCase() },
      })
    )
  );

  const sampleProducts = [
    {
      name: "Air Stride Runner",
      gender: "MEN" as const,
      categoryId: men.id,
      brand: brands[0],
      cost: 3500,
      price: 6500,
      discount: 5499,
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
      colors: ["black", "white"],
      featured: true,
    },
    {
      name: "Nairobi Street Low-Top",
      gender: "MEN" as const,
      categoryId: men.id,
      brand: brands[1],
      cost: 2800,
      price: 5200,
      images: ["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800"],
      colors: ["navy", "grey"],
      featured: true,
    },
    {
      name: "Savanna Trail Boot",
      gender: "MEN" as const,
      categoryId: men.id,
      brand: brands[3],
      cost: 4200,
      price: 7800,
      images: ["https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800"],
      colors: ["brown"],
      featured: false,
    },
    {
      name: "Clay Block Heel",
      gender: "WOMEN" as const,
      categoryId: women.id,
      brand: brands[4],
      cost: 3000,
      price: 5800,
      images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800"],
      colors: ["clay", "black"],
      featured: true,
    },
    {
      name: "Ochre Canvas Sneaker",
      gender: "WOMEN" as const,
      categoryId: women.id,
      brand: brands[2],
      cost: 2400,
      price: 4500,
      images: ["https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800"],
      colors: ["ochre", "white"],
      featured: false,
    },
    {
      name: "Junior School Oxford",
      gender: "KIDS" as const,
      categoryId: kids.id,
      brand: brands[3],
      cost: 1500,
      price: 2800,
      images: ["https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800"],
      colors: ["black"],
      featured: true,
    },
  ];

  const menSizes = ["39", "40", "41", "42", "43", "44"];
  const womenSizes = ["36", "37", "38", "39", "40"];
  const kidsSizes = ["28", "29", "30", "31", "32"];

  for (const p of sampleProducts) {
    const slug = p.name.toLowerCase().replace(/\s+/g, "-");
    const sizes = p.gender === "MEN" ? menSizes : p.gender === "WOMEN" ? womenSizes : kidsSizes;

    const variants = sizes.flatMap((size) =>
      p.colors.map((color) => ({
        size,
        color,
        sku: `${slug}-${size}-${color}`.toUpperCase(),
        stock: Math.floor(Math.random() * 15) + 1,
      }))
    );

    await prisma.product.upsert({
      where: { storeId_slug: { storeId: store.id, slug } },
      update: {},
      create: {
        storeId: store.id,
        name: p.name,
        slug,
        description: `The ${p.name} is built for everyday wear on Kenyan ground — durable construction, comfortable fit, and a look that goes from the matatu stage to the office.`,
        sku: slug.toUpperCase(),
        gender: p.gender,
        categoryId: p.categoryId,
        brandId: p.brand.id,
        costPrice: p.cost,
        sellingPrice: p.price,
        discountPrice: p.discount ?? null,
        status: "ACTIVE",
        isFeatured: p.featured,
        images: { create: p.images.map((url, i) => ({ url, position: i })) },
        variants: { create: variants },
      },
    });
  }

  console.log(`Seeded ${sampleProducts.length} products across ${brandNames.length} brands.`);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
