import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
}

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/shared/schema.ts",
    out: "./migrations",
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
