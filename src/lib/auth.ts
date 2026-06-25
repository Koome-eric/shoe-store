import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CUSTOMER" | "ADMIN" | "STAFF" | "SUPER_ADMIN";
      phone?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "CUSTOMER" | "ADMIN" | "STAFF" | "SUPER_ADMIN";
    phone?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "CUSTOMER" | "ADMIN" | "STAFF" | "SUPER_ADMIN";
    phone?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Customer-facing storefront login — identified by phone number.
    Credentials({
      id: "customer",
      name: "Customer",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const phone = credentials?.phone as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!phone || !password) return null;

        const customer = await prisma.customer.findUnique({ where: { phone } });
        if (!customer || !customer.passwordHash) return null;

        const valid = await bcrypt.compare(password, customer.passwordHash);
        if (!valid) return null;

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email ?? undefined,
          phone: customer.phone,
          role: "CUSTOMER" as const,
        };
      },
    }),
    // Admin / staff login — identified by email.
    Credentials({
      id: "admin",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.phone = user.phone ?? null;
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.role) session.user.role = token.role as "CUSTOMER" | "ADMIN" | "STAFF" | "SUPER_ADMIN";
      session.user.phone = (token.phone as string | null | undefined) ?? null;
      return session;
    },
  },
});
