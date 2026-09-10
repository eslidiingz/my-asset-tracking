import { ChevronRight } from "lucide-react";
import type { Asset, AssetGroup, AssetGroupValueTransaction } from "@/lib/db";
import { assetCost, currencyForAssetCategory, formatCurrency } from "@/lib/utils";
import { AssetMark } from "@/components/asset-mark";
import { Button } from "@/components/ui/button";
import { GroupValueHistory } from "@/components/group-value-history";
import { GroupValueSummary } from "@/components/group-value-summary";
import { DividendIncomeCard } from "@/components/dividend-income-card";
import Link from "next/link";

const allocationColors: Record<string, string> = { Stocks: "#c8ff52", Property: "#9478ff", Cash: "#5de4c7", Crypto: "#f1bb5b", "Mutual Fund": "#72ddf7", Gold: "#ffb86c", "Private Fund": "#bc8cff", TSD: "#74d99c" };
type DividendTransaction = { id: number; currency: "USD" | "THB"; dividendAmount: number; withholdingTax: number; receivedAt: Date };

export function Dashboard({ assets, groups, groupValueTransactions, dividendTransactions, usdToThbRate }: { assets: Asset[]; groups: AssetGroup[]; groupValueTransactions: AssetGroupValueTransaction[]; dividendTransactions: DividendTransaction[]; usdToThbRate: number | null }) {
  const total = assets.reduce((sum, asset) => sum + assetCost(asset), 0);
  const allocation = Object.entries(assets.reduce<Record<string, number>>((result, asset) => {
    result[asset.category] = (result[asset.category] ?? 0) + assetCost(asset);
    return result;
  }, {})).sort((a, b) => b[1] - a[1]);
  const allocationTotal = total || 1;
  const allocationPie = (() => {
    let offset = 0;
    const segments = allocation.map(([name, value]) => {
      const start = offset;
      offset += value / allocationTotal * 100;
      return `${allocationColors[name]} ${start}% ${offset}%`;
    });
    return `conic-gradient(${segments.join(", ")})`;
  })();
  const topHoldings = assets.slice(0, 5);

  return <main className="mx-auto w-full max-w-[1480px] px-4 pb-28 pt-6 sm:px-6 md:pt-8 lg:px-8 lg:pb-10">
    <div><p className="eyebrow">Portfolio · Live overview</p><h1 className="mt-2 text-[clamp(1.75rem,5.5vw,2.8rem)] font-extrabold leading-none tracking-[-.055em]">Your financial picture</h1></div>

    <section aria-label="Portfolio summary" className="bento-grid mt-6">
      <article className="bento-card"><div><p className="label">Allocation</p><p className="mt-1 text-xs text-muted">{assets.length} holdings · {allocation.length} classes</p></div><div className="mt-6 flex justify-center"><div className="size-36 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.08)] sm:size-40" style={{ background: allocationPie }} role="img" aria-label="Asset allocation pie chart"/></div><div className="mt-6 grid grid-cols-3 gap-x-3 gap-y-4">{allocation.map(([name, value]) => <div key={name}><div className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: allocationColors[name] }}/><span className="text-xs font-semibold text-muted">{name}</span></div><p className="mt-1 text-base font-extrabold">{(value / allocationTotal * 100).toFixed(1)}%</p></div>)}</div></article>

      <section className="bento-card overflow-hidden !p-0 md:col-span-2 lg:col-span-3"><div className="flex items-center justify-between border-b border-line px-5 py-5 md:px-6"><div><h2 className="text-lg font-extrabold tracking-[-.03em]">Top holdings</h2><p className="mt-0.5 text-xs text-muted">Ranked by cost basis</p></div><Button asChild variant="ghost" size="sm"><Link href="/assets">See all <ChevronRight size={14}/></Link></Button></div><div><table className="holdings-table w-full text-left"><thead><tr><th>Asset</th><th>Category</th><th className="text-right">Average price</th><th className="text-right">Yield</th><th className="text-right">Cost basis</th></tr></thead><tbody>{topHoldings.map(asset => <tr key={asset.id}><td><div className="flex items-center gap-3"><AssetMark category={asset.category} color={allocationColors[asset.category]}/><div className="min-w-0"><p className="truncate text-sm font-bold">{asset.symbol}</p><p className="text-[11px] text-muted">{asset.units} units</p></div></div></td><td data-secondary><span className="category-pill">{asset.category}</span></td><td data-secondary className="text-right text-sm font-semibold">{formatCurrency(asset.averagePrice, currencyForAssetCategory(asset.category))}</td><td data-secondary className="text-right text-sm font-bold text-accent">{asset.dividendYield ? `${asset.dividendYield.toFixed(2)}%` : "—"}</td><td className="text-right text-sm font-extrabold">{formatCurrency(assetCost(asset), currencyForAssetCategory(asset.category))}</td></tr>)}</tbody></table></div></section>
    </section>

    <GroupValueHistory groups={groups} transactions={groupValueTransactions}/>

    <GroupValueSummary groups={groups} transactions={groupValueTransactions}/>

    <DividendIncomeCard transactions={dividendTransactions.map((transaction) => ({ ...transaction, receivedAt: transaction.receivedAt.toISOString() }))} usdToThbRate={usdToThbRate}/>

  </main>;
}
