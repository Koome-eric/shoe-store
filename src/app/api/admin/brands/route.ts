import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { slugify } from "@/lib/utils";

export async function GET() {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(brands);
}

const createSchema = z.object({ name: z.string().min(2), logoUrl: z.string().url().optional() });

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const brand = await prisma.brand.create({
    data: { name: parsed.data.name, slug: slugify(parsed.data.name), logoUrl: parsed.data.logoUrl },
  });

  return NextResponse.json(brand, { status: 201 });
}
