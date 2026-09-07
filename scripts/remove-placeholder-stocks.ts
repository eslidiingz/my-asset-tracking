import dotenv from "dotenv";
import { and, eq } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

async function main() {
  const databaseModule = await import("@/db") as typeof import("@/db") & { default?: typeof import("@/db") };
  const schemaModule = await import("@/db/schema") as typeof import("@/db/schema") & { default?: typeof import("@/db/schema") };
  const { db } = databaseModule.default ?? databaseModule;
  const { assets, portfolioSnapshots, users } = schemaModule.default ?? schemaModule;
  const userAccounts = await db.select({ id: users.id }).from(users);
  if (userAccounts.length !== 1) throw new Error(`Expected exactly one user account, found ${userAccounts.length}.`);

  const userId = userAccounts[0].id;
  const placeholders = await db.select({ id: assets.id, symbol: assets.symbol }).from(assets).where(and(eq(assets.userId, userId), eq(assets.category, "Stocks"), eq(assets.averagePrice, 0), eq(assets.units, 1)));

  if (placeholders.length > 0) {
    await Promise.all(placeholders.map((asset) => db.delete(assets).where(eq(assets.id, asset.id))));
  }

  const remainingAssets = await db.select({ units: assets.units, averagePrice: assets.averagePrice }).from(assets).where(eq(assets.userId, userId));
  const totalValue = remainingAssets.reduce((total, asset) => total + asset.units * asset.averagePrice, 0);
  await db.insert(portfolioSnapshots).values({ userId, totalValue });
  console.log(JSON.stringify({ removed: placeholders.length, portfolioSnapshotValue: totalValue }));
}

main();
