import dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

type Holding = { symbol: string; units: number; averagePrice: number; dividendYield: number };

const holdings: Holding[] = [
  { symbol: "NVDA", units: 31.0164076, averagePrice: 146.55, dividendYield: 0.48 },
  { symbol: "GOOGL", units: 7.4954523, averagePrice: 296.01, dividendYield: 0.22 },
  { symbol: "AVGO", units: 4.8930631, averagePrice: 291.32, dividendYield: 0.64 },
  { symbol: "TSM", units: 5.2404076, averagePrice: 307.02, dividendYield: 0.93 },
  { symbol: "AMZN", units: 6.5696862, averagePrice: 214.27, dividendYield: 0 },
  { symbol: "MSFT", units: 2.5073103, averagePrice: 435.99, dividendYield: 0.8 },
  { symbol: "META", units: 2.2709261, averagePrice: 649.64, dividendYield: 0.3 },
  { symbol: "FIX", units: 0.4507165, averagePrice: 1837.9, dividendYield: 0.3 },
  { symbol: "VRT", units: 1.467753, averagePrice: 268.66, dividendYield: 0.3 },
  { symbol: "AAPL", units: 2.4340254, averagePrice: 261.7, dividendYield: 0.41 },
  { symbol: "LLY", units: 1.7373997, averagePrice: 815.59, dividendYield: 0.78 },
  { symbol: "ARM", units: 5.3754358, averagePrice: 140.21, dividendYield: 0 },
  { symbol: "TSLA", units: 3.1197268, averagePrice: 289.75, dividendYield: 0 },
  { symbol: "PLTR", units: 11.2270559, averagePrice: 124.77, dividendYield: 0 },
  { symbol: "ASML", units: 0.7772711, averagePrice: 1364.74, dividendYield: 0.5 },
  { symbol: "NFLX", units: 11.1560434, averagePrice: 91.25, dividendYield: 0 },
  { symbol: "ANET", units: 5.0125896, averagePrice: 119.03, dividendYield: 0 },
  { symbol: "SNDK", units: 0.5476866, averagePrice: 1333.18, dividendYield: 0 },
  { symbol: "CRWD", units: 4.0891498, averagePrice: 165.42, dividendYield: 0 },
  { symbol: "MU", units: 0.5608654, averagePrice: 759.35, dividendYield: 0 },
  { symbol: "RKLB", units: 9.1489522, averagePrice: 47.87, dividendYield: 0 },
  { symbol: "ASTS", units: 9.5516779, averagePrice: 68.82, dividendYield: 0 },
  { symbol: "CRDO", units: 2.8824677, averagePrice: 142.55, dividendYield: 0 },
  { symbol: "NBIS", units: 2.3078725, averagePrice: 137.17, dividendYield: 0 },
  { symbol: "RBRK", units: 5.390115, averagePrice: 52.72, dividendYield: 0 },
  { symbol: "IONQ", units: 6.0310713, averagePrice: 44.4, dividendYield: 0 },
  { symbol: "NVTS", units: 23.6526491, averagePrice: 18.69, dividendYield: 0 },
  { symbol: "MXL", units: 4.0834535, averagePrice: 76.59, dividendYield: 0 },
  { symbol: "DOCN", units: 0.8631852, averagePrice: 115.85, dividendYield: 0 },
  { symbol: "KTOS", units: 1.0189229, averagePrice: 54.96, dividendYield: 0 },
  { symbol: "ONDS", units: 10, averagePrice: 8.82, dividendYield: 0 },
  { symbol: "COST", units: 0.7345802, averagePrice: 945.29, dividendYield: 0.58 },
  { symbol: "V", units: 1.7597532, averagePrice: 316.77, dividendYield: 0.64 },
  { symbol: "HCA", units: 0.9933458, averagePrice: 433.56, dividendYield: 0.79 },
  { symbol: "WM", units: 1.5456947, averagePrice: 224.83, dividendYield: 1.67 },
  { symbol: "QQQI", units: 11.1131258, averagePrice: 46.4, dividendYield: 13.84 },
  { symbol: "ABBV", units: 1.5766256, averagePrice: 195.7, dividendYield: 3.14 },
  { symbol: "YMAG", units: 30.0009747, averagePrice: 12.31, dividendYield: 52.9 },
  { symbol: "SMH", units: 0.84584, averagePrice: 579.95, dividendYield: 0 },
  { symbol: "SPMO", units: 1.38086, averagePrice: 149.91, dividendYield: 0 },
  { symbol: "QQQM", units: 0.17099, averagePrice: 293.49, dividendYield: 0 },
  { symbol: "QTUM", units: 0.27627, averagePrice: 150.9, dividendYield: 0 },
  { symbol: "UFO", units: 0.96454, averagePrice: 46.03, dividendYield: 0 },
];

async function main() {
  const databaseModule = await import("@/db") as typeof import("@/db") & { default?: typeof import("@/db") };
  const schemaModule = await import("@/db/schema") as typeof import("@/db/schema") & { default?: typeof import("@/db/schema") };
  const { db } = databaseModule.default ?? databaseModule;
  const { assets, portfolioSnapshots, users } = schemaModule.default ?? schemaModule;
  const userAccounts = await db.select({ id: users.id }).from(users);
  if (userAccounts.length !== 1) throw new Error(`Expected exactly one user account, found ${userAccounts.length}.`);

  const userId = userAccounts[0].id;
  const existingAssets = await db.select({ id: assets.id, symbol: assets.symbol }).from(assets).where(eq(assets.userId, userId));
  const existingBySymbol = new Map(existingAssets.filter((asset) => asset.symbol !== null).map((asset) => [asset.symbol, asset.id]));
  let added = 0;
  let updated = 0;

  for (const holding of holdings) {
    const id = existingBySymbol.get(holding.symbol);
    const values = { category: "Stocks" as const, units: holding.units, averagePrice: holding.averagePrice, dividendYield: holding.dividendYield, color: "#c8ff52" };
    if (id === undefined) {
      await db.insert(assets).values({ ...values, userId, symbol: holding.symbol });
      added += 1;
    } else {
      await db.update(assets).set(values).where(eq(assets.id, id));
      updated += 1;
    }
  }

  const allAssets = await db.select({ units: assets.units, averagePrice: assets.averagePrice }).from(assets).where(eq(assets.userId, userId));
  const totalValue = allAssets.reduce((total, asset) => total + asset.units * asset.averagePrice, 0);
  await db.insert(portfolioSnapshots).values({ userId, totalValue });
  console.log(JSON.stringify({ added, updated, totalHoldingsImported: holdings.length, portfolioSnapshotValue: totalValue }));
}

main();
