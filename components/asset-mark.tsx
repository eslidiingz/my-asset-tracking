import { Landmark, Bitcoin, Building2, Banknote, Coins, Gem, HandCoins, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = { Stocks: Landmark, Crypto: Bitcoin, Property: Building2, Cash: Banknote, "Mutual Fund": Coins, Gold: Gem, "Private Fund": HandCoins, TSD: Landmark };

export function AssetMark({ category, color }: { category: string; color: string }) {
  const Icon = icons[category] ?? Landmark;
  return <span className="grid size-9 place-items-center rounded-xl border border-white/5" style={{ backgroundColor: `${color}18`, color }}><Icon size={17} strokeWidth={1.8} /></span>;
}
