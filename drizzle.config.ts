import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
if (!process.env.TURSO_DATABASE_URL) throw new Error("TURSO_DATABASE_URL is not configured");
if (!process.env.TURSO_AUTH_TOKEN) throw new Error("TURSO_AUTH_TOKEN is not configured");

export default defineConfig({ schema: "./db/schema.ts", out: "./drizzle", dialect: "turso", dbCredentials: { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN } });
