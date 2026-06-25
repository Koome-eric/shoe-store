import "dotenv/config";
import { defineConfig } from "prisma/config";

const directUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI (migrate, db push, studio) uses this connection directly.
    // For Neon, prefer the DIRECT (non-pooler) connection string here.
    // If that is not available yet, fall back to the pooled URL or a local placeholder.
    url: directUrl ?? "postgresql://postgres:postgres@localhost:5432/shoeshop",
  },
});
