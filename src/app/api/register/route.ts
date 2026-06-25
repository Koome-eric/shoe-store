import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations/schemas";
import { prisma } from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { normalizeKenyanPhone } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form for errors", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const phone = normalizeKenyanPhone(parsed.data.phone);
    const storeId = await getStoreId();

    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this phone number already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const customer = await prisma.customer.create({
      data: {
        storeId,
        name,
        phone,
        email: email || null,
        passwordHash,
      },
    });

    return NextResponse.json({ id: customer.id, phone: customer.phone });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
