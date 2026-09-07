"use client";

import { useMemo, useState } from "react";
import type { PortfolioGrowth } from "@/lib/portfolio";
import { formatCurrency } from "@/lib/utils";

export function GrowthChart({ growth }: { growth: PortfolioGrowth }) {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const points = growth[period];
  const { path, area, change } = useMemo(() => {
    const values = points.map(point => point.value); const min = Math.min(...values) * .96; const max = Math.max(...values) * 1.02; const range = max - min || 1;
    const coordinates = values.map((value, index) => [index / Math.max(values.length - 1, 1) * 100, 92 - ((value - min) / range * 80)] as const);
    const line = coordinates.map(([x, y], index) => `${index ? "L" : "M"}${x},${y}`).join(" ");
    const filled = `${line} L100,100 L0,100 Z`;
    return { path: line, area: filled, change: ((values.at(-1)! - values[0]) / values[0]) * 100 };
  }, [points]);
  return <section className="bento-card growth-card"><div className="flex items-start justify-between gap-4"><div><p className="label">Portfolio growth</p><div className="mt-2 flex items-baseline gap-2"><p className="text-2xl font-extrabold tracking-[-.05em]">{formatCurrency(points.at(-1)?.value ?? 0)}</p><span className="text-xs font-bold text-positive">+{change.toFixed(1)}%</span></div><p className="mt-1 text-[11px] text-muted">{growth.isDemo ? "Illustrative until your first snapshots are recorded" : `Recorded ${period === "monthly" ? "monthly" : "yearly"} performance`}</p></div><div className="segmented-control"><button onClick={() => setPeriod("monthly")} aria-pressed={period === "monthly"} className={period === "monthly" ? "active" : ""}>Month</button><button onClick={() => setPeriod("yearly")} aria-pressed={period === "yearly"} className={period === "yearly" ? "active" : ""}>Year</button></div></div>
    <div className="relative mt-5 h-36"><div className="absolute inset-0 chart-grid"/><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-label={`${period} portfolio growth chart`} role="img"><defs><linearGradient id="growth-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#5de4c7" stopOpacity=".28"/><stop offset="1" stopColor="#5de4c7" stopOpacity="0"/></linearGradient></defs><path d={area} fill="url(#growth-fill)"/><path d={path} fill="none" stroke="#5de4c7" strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/></svg><div className="absolute bottom-0 flex w-full justify-between text-[9px] font-semibold text-muted">{points.filter((_, index) => index === 0 || index === points.length - 1 || (points.length > 6 && index === Math.floor(points.length / 2))).map(point => <span key={point.label}>{point.label}</span>)}</div></div>
  </section>;
}
