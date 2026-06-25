import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const schema = z.object({ productId: z.string() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Please log in to save items" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { productId } = parsed.data;
  const customerId = session.user.id;

  const existing = await prisma.wishlistItem.findUnique({
    where: { customerId_productId: { customerId, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ wishlisted: false });
  }

  await prisma.wishlistItem.create({ data: { customerId, productId } });
  return NextResponse.json({ wishlisted: true });
}
