import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { portfolioSnapshots } from "@/db/schema";

export type GrowthPoint = { label: string; value: number };
export type PortfolioGrowth = { monthly: GrowthPoint[]; yearly: GrowthPoint[]; isDemo: boolean };

const demoMonthly = [52000, 53500, 52700, 55100, 56800, 57900, 60400, 61500, 64200, 67100, 69300, 71532].map((value, index) => ({ label: new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(2026, index, 1)), value }));
const demoYearly = [{ label: "2022", value: 38500 }, { label: "2023", value: 46200 }, { label: "2024", value: 54800 }, { label: "2025", value: 63900 }, { label: "2026", value: 71532 }];

function groupSnapshots(rows: { recordedAt: Date; totalValue: number }[], mode: "month" | "year"): GrowthPoint[] {
  const grouped = new Map<string, GrowthPoint>();
  for (const row of rows) {
    const label = mode === "month" ? new Intl.DateTimeFormat("en", { month: "short" }).format(row.recordedAt) : String(row.recordedAt.getFullYear());
    const key = mode === "month" ? `${row.recordedAt.getFullYear()}-${row.recordedAt.getMonth()}` : String(row.recordedAt.getFullYear());
    grouped.set(key, { label, value: row.totalValue });
  }
  return [...grouped.values()];
}

export async function getPortfolioGrowth(userId: string): Promise<PortfolioGrowth> {
  const snapshots = await db.select().from(portfolioSnapshots).where(eq(portfolioSnapshots.userId, userId)).orderBy(asc(portfolioSnapshots.recordedAt));
  if (snapshots.length < 2) return { monthly: demoMonthly, yearly: demoYearly, isDemo: true };
  return { monthly: groupSnapshots(snapshots, "month"), yearly: groupSnapshots(snapshots, "year"), isDemo: false };
}
