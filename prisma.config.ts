import { defineConfig, env } from "prisma/config";
import "dotenv/config"

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seeds/index.ts",
  },
  engine: "classic",
  datasource: {
    url: process.env["DATABASE_URL"]!,
  },
});
