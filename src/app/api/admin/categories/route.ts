import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { requireAdmin } from "@/lib/admin-guard";
import { slugify } from "@/lib/utils";

export async function GET() {
  const storeId = await getStoreId();
  const categories = await prisma.category.findMany({
    where: { storeId },
    include: { children: true, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

const createSchema = z.object({
  name: z.string().min(2),
  parentId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const storeId = await getStoreId();
  const slug = slugify(parsed.data.name);

  const category = await prisma.category.create({
    data: { storeId, name: parsed.data.name, slug, parentId: parsed.data.parentId || null },
  });

  return NextResponse.json(category, { status: 201 });
}
