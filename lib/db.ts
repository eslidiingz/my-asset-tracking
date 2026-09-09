import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { assetGroupValueTransactions, assetGroups, assets, currencySettings, dividendTransactions, type Asset, type AssetGroup, type AssetGroupValueTransaction, type CurrencySettings } from "@/db/schema";
export type { Asset, AssetGroup, AssetGroupValueTransaction, CurrencySettings } from "@/db/schema";

const demoAssets: Asset[] = [
  { id: 1, userId: null, symbol: "NVDA", category: "Stocks", units: 34, averagePrice: 156.72, totalCost: null, dividendYield: 0.03, color: "#62715d", groupId: null },
  { id: 2, userId: null, symbol: "AAPL", category: "Stocks", units: 22, averagePrice: 198.16, totalCost: null, dividendYield: 0.42, color: "#879985", groupId: null },
  { id: 3, userId: null, symbol: "BTC", category: "Crypto", units: 0.083, averagePrice: 96500, totalCost: null, dividendYield: null, color: "#d29a50", groupId: null },
  { id: 4, userId: null, symbol: "HOME", category: "Property", units: 1, averagePrice: 38150, totalCost: null, dividendYield: null, color: "#927b69", groupId: null },
  { id: 5, userId: null, symbol: "USD", category: "Cash", units: 1, averagePrice: 12480, totalCost: null, dividendYield: null, color: "#c5bfb2", groupId: null },
];

export async function getAssets(userId: string): Promise<Asset[]> {
  const result = await db.select().from(assets).where(eq(assets.userId, userId)).orderBy(desc(sql`coalesce(${assets.totalCost}, ${assets.units} * ${assets.averagePrice})`));
  return result.length > 0 ? result : demoAssets;
}

export async function getAssetGroups(userId: string): Promise<AssetGroup[]> {
  return db.select().from(assetGroups).where(eq(assetGroups.userId, userId)).orderBy(asc(assetGroups.sortOrder), asc(assetGroups.name));
}

export async function getAssetGroupValueTransactions(userId: string): Promise<AssetGroupValueTransaction[]> {
  return db.select().from(assetGroupValueTransactions).where(eq(assetGroupValueTransactions.userId, userId)).orderBy(asc(assetGroupValueTransactions.recordedAt), asc(assetGroupValueTransactions.id));
}

export async function getCurrencySettings(userId: string): Promise<CurrencySettings | null> {
  const [settings] = await db.select().from(currencySettings).where(eq(currencySettings.userId, userId)).limit(1);
  return settings ?? null;
}

export async function getDividendTransactions(userId: string) {
  return db.select().from(dividendTransactions).where(eq(dividendTransactions.userId, userId)).orderBy(desc(dividendTransactions.receivedAt));
}
