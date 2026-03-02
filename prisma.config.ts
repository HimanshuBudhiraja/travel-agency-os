import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Fallback dummy URL allows `prisma generate` to run during CI/build
    // without a live database. Real DATABASE_URL must be set at runtime.
    url: process.env["DATABASE_URL"] ?? "postgresql://build:build@localhost:5432/build",
  },
});
