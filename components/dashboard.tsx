import { ArrowUpRight, ChevronRight, MoreHorizontal, Sparkles, Wallet } from "lucide-react";
import type { Asset, AssetGroup, AssetGroupValueTransaction } from "@/lib/db";
import { assetCost, currencyForAssetCategory, formatCurrency } from "@/lib/utils";
import { AssetMark } from "@/components/asset-mark";
import { Button } from "@/components/ui/button";
import { PortfolioChart } from "@/components/portfolio-chart";
import { GrowthChart } from "@/components/growth-chart";
import type { PortfolioGrowth } from "@/lib/portfolio";
import { GroupValueHistory } from "@/components/group-value-history";
import { GroupValueSummary } from "@/components/group-value-summary";

const allocationColors: Record<string, string> = { Stocks: "#c8ff52", Property: "#9478ff", Cash: "#5de4c7", Crypto: "#f1bb5b", "Mutual Fund": "#72ddf7", Gold: "#ffb86c", "Private Fund": "#bc8cff", TSD: "#74d99c" };

export function Dashboard({ assets, growth, groups, groupValueTransactions }: { assets: Asset[]; growth: PortfolioGrowth; groups: AssetGroup[]; groupValueTransactions: AssetGroupValueTransaction[] }) {
  const total = assets.reduce((sum, asset) => sum + assetCost(asset), 0);
  const allocation = Object.entries(assets.reduce<Record<string, number>>((result, asset) => {
    result[asset.category] = (result[asset.category] ?? 0) + assetCost(asset);
    return result;
  }, {})).sort((a, b) => b[1] - a[1]);
  const annualDividend = assets.filter(asset => asset.category === "Stocks" && asset.dividendYield).reduce((total, asset) => total + assetCost(asset) * (asset.dividendYield ?? 0) / 100, 0);
  const topHoldings = assets.slice(0, 10);

  return <main className="mx-auto w-full max-w-[1480px] px-4 pb-28 pt-6 sm:px-6 md:pt-8 lg:px-8 lg:pb-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Portfolio · Live overview</p><h1 className="mt-2 text-[clamp(1.75rem,5.5vw,2.8rem)] font-extrabold leading-none tracking-[-.055em]">Your financial picture</h1></div><Button variant="outline" className="h-9 text-muted">6 months <ChevronRight size={14} /></Button></div>

    <section aria-label="Portfolio summary" className="bento-grid mt-6">
      <article className="bento-card bento-value"><div className="flex items-start justify-between"><div><p className="label">Net worth</p><p className="mt-2 text-[clamp(2.5rem,11vw,4.6rem)] font-extrabold leading-none tracking-[-.075em]">{formatCurrency(total)}</p></div><button aria-label="Portfolio options" className="icon-button"><MoreHorizontal size={19} /></button></div><div className="mt-3 flex flex-wrap items-center gap-2"><span className="data-pill positive"><ArrowUpRight size={13}/> 5.28%</span><span className="text-xs text-muted">+$3,585 in six months</span></div><PortfolioChart /></article>


      <article className="bento-card bento-allocation"><div className="flex items-start justify-between"><div><p className="label">Allocation</p><p className="mt-1 text-xs text-muted">{assets.length} holdings · 4 classes</p></div><span className="icon-button"><Wallet size={17}/></span></div><div className="mt-7 flex h-2.5 overflow-hidden rounded-full bg-soft">{allocation.map(([name, value]) => <span className="allocation-segment" key={name} style={{ width: `${value / total * 100}%`, background: allocationColors[name] }} />)}</div><div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4">{allocation.map(([name, value]) => <div key={name}><div className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: allocationColors[name] }}/><span className="text-xs font-semibold text-muted">{name}</span></div><p className="mt-1 text-base font-extrabold">{(value / total * 100).toFixed(1)}%</p></div>)}</div></article>

      <article className="bento-card bento-insight"><div className="flex items-center gap-2 text-accent"><Sparkles size={16}/><p className="label !text-accent">Dividend income</p></div><p className="mt-5 text-3xl font-extrabold tracking-[-.055em]">{formatCurrency(annualDividend)}<span className="ml-1 text-sm font-semibold text-muted">/ yr</span></p><p className="mt-2 max-w-[35ch] text-xs leading-relaxed text-muted">Estimated annual income from US stock dividend yields in your portfolio.</p><button className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-accent">View income details <ChevronRight size={13}/></button></article>
    </section>

    <GrowthChart growth={growth}/>

    <GroupValueHistory groups={groups} transactions={groupValueTransactions}/>

    <GroupValueSummary groups={groups} transactions={groupValueTransactions}/>

    <section className="bento-card !mt-3 overflow-hidden !p-0 md:!mt-4"><div className="flex items-center justify-between border-b border-line px-5 py-5 md:px-6"><div><h2 className="text-lg font-extrabold tracking-[-.03em]">Top holdings</h2><p className="mt-0.5 text-xs text-muted">Ranked by cost basis</p></div><Button variant="ghost" size="sm">See all <ChevronRight size={14}/></Button></div><div><table className="holdings-table w-full text-left"><thead><tr><th>Asset</th><th>Category</th><th className="text-right">Average price</th><th className="text-right">Yield</th><th className="text-right">Cost basis</th></tr></thead><tbody>{topHoldings.map(asset => <tr key={asset.id}><td><div className="flex items-center gap-3"><AssetMark category={asset.category} color={allocationColors[asset.category]}/><div className="min-w-0"><p className="truncate text-sm font-bold">{asset.symbol}</p><p className="text-[11px] text-muted">{asset.units} units</p></div></div></td><td data-secondary><span className="category-pill">{asset.category}</span></td><td data-secondary className="text-right text-sm font-semibold">{formatCurrency(asset.averagePrice, currencyForAssetCategory(asset.category))}</td><td data-secondary className="text-right text-sm font-bold text-accent">{asset.dividendYield ? `${asset.dividendYield.toFixed(2)}%` : "—"}</td><td className="text-right text-sm font-extrabold">{formatCurrency(assetCost(asset), currencyForAssetCategory(asset.category))}</td></tr>)}</tbody></table></div></section>
  </main>;
}
