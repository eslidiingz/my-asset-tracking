"use client";

import { useState } from "react";
import type { AssetGroup, AssetGroupValueTransaction } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

function formatAxisValue(value: number) {
  const units = [[1_000_000_000, "B"], [1_000_000, "M"], [1_000, "K"]] as const;
  const unit = units.find(([threshold]) => Math.abs(value) >= threshold);
  if (!unit) return value.toFixed(0);
  if (unit[1] === "K") return `${Math.round(value / unit[0])}K`;
  return `${(value / unit[0]).toFixed(2).replace(/\.?0+$/, "")}${unit[1]}`;
}

function formatBaht(value: number) {
  return formatCurrency(value, "THB").replace("THB", "฿");
}

export function GroupValueSummary({ groups, transactions, className = "" }: { groups: AssetGroup[]; transactions: AssetGroupValueTransaction[]; className?: string }) {
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const latestByGroup = new Map<number, AssetGroupValueTransaction>();
  for (const transaction of transactions) {
    const current = latestByGroup.get(transaction.groupId);
    if (!current || transaction.recordedAt > current.recordedAt || (transaction.recordedAt.getTime() === current.recordedAt.getTime() && transaction.id > current.id)) latestByGroup.set(transaction.groupId, transaction);
  }
  const summaries = groups.flatMap((group) => {
    const transaction = latestByGroup.get(group.id);
    return transaction ? [{ group, transaction }] : [];
  });

  if (summaries.length === 0) return null;
  const totalValue = summaries.reduce((sum, { transaction }) => sum + transaction.totalValue, 0);
  const latestRecordedAt = summaries.reduce((latest, { transaction }) => transaction.recordedAt > latest ? transaction.recordedAt : latest, summaries[0].transaction.recordedAt);
  const monthlyValues = Array.from({ length: 12 }, (_, index) => {
    const month = new Date(latestRecordedAt.getFullYear(), latestRecordedAt.getMonth() - 11 + index, 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
    let hasRecordedValue = false;
    const value = groups.reduce((sum, group) => {
      const latestValue = transactions.reduce<AssetGroupValueTransaction | null>((current, transaction) => transaction.groupId === group.id && transaction.recordedAt <= monthEnd && (!current || transaction.recordedAt > current.recordedAt || (transaction.recordedAt.getTime() === current.recordedAt.getTime() && transaction.id > current.id)) ? transaction : current, null);
      if (latestValue) hasRecordedValue = true;
      return sum + (latestValue?.totalValue ?? 0);
    }, 0);
    return hasRecordedValue ? [{ label: new Intl.DateTimeFormat("en", { month: "short" }).format(month), value }] : [];
  }).flat();
  const highestMonthlyValue = Math.max(...monthlyValues.map((point) => point.value), 1);
  const firstMonthlyValue = monthlyValues[0].value;
  const growth = firstMonthlyValue > 0 ? (totalValue - firstMonthlyValue) / firstMonthlyValue * 100 : null;
  const lowestMonthlyValue = Math.min(...monthlyValues.map((point) => point.value)) * .98;
  const monthlyRange = highestMonthlyValue * 1.02 - lowestMonthlyValue || 1;
  const chartHigh = highestMonthlyValue * 1.02;
  const monthlyCoordinates = monthlyValues.map((point, index) => [index / Math.max(monthlyValues.length - 1, 1) * 100, 100 - (point.value - lowestMonthlyValue) / monthlyRange * 100] as const);
  const monthlyPath = monthlyCoordinates.map(([x, y], index) => `${index ? "L" : "M"}${x},${y}`).join(" ");
  const monthlyArea = `${monthlyPath} L100,100 L0,100 Z`;
  const axisTicks = Array.from({ length: 10 }, (_, index) => chartHigh - monthlyRange * index / 9);
  const hoveredMonth = hoveredMonthIndex === null ? null : monthlyValues[Math.min(hoveredMonthIndex, monthlyValues.length - 1)];

  return <section className={`bento-card !p-5 md:!p-6 ${className || "!mt-3 md:!mt-4"}`}><div><p className="label">Net worth</p><p className="mt-2 text-[clamp(2.5rem,11vw,4.6rem)] font-extrabold leading-none tracking-[-.075em]">{formatBaht(totalValue)}</p></div><div className="mt-5 border-t border-line pt-3"><div className="flex items-center justify-between gap-3"><p className="label">12-month growth</p>{hoveredMonth ? <p className="text-[11px] font-extrabold text-accent">{hoveredMonth.label} · {formatBaht(hoveredMonth.value)}</p> : growth !== null && <p className={growth >= 0 ? "text-[11px] font-extrabold text-positive" : "text-[11px] font-extrabold text-negative"}>{growth >= 0 ? "+" : ""}{growth.toFixed(1)}%</p>}</div><div className="mt-3 grid grid-cols-[2.5rem_1fr] gap-1"><div className="flex h-44 flex-col justify-between text-left text-[9px] font-bold tabular-nums text-muted">{axisTicks.map((value, index) => <span key={index}>{formatAxisValue(value)}</span>)}</div><div className="relative h-44" role="img" aria-label="Net worth over the last twelve months"><div className="absolute inset-0">{axisTicks.map((_, index) => <span key={index} className="absolute left-0 right-0 border-t border-line/70" style={{ top: `${index / (axisTicks.length - 1) * 100}%` }}/>)}</div><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="relative h-full w-full cursor-crosshair" onMouseMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); setHoveredMonthIndex(Math.round((event.clientX - bounds.left) / bounds.width * (monthlyValues.length - 1))); }} onMouseLeave={() => setHoveredMonthIndex(null)}><defs><linearGradient id="total-assets-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#c8ff52" stopOpacity=".32"/><stop offset="1" stopColor="#c8ff52" stopOpacity="0"/></linearGradient></defs><path d={monthlyArea} fill="url(#total-assets-fill)"/><path d={monthlyPath} fill="none" stroke="#c8ff52" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>{monthlyCoordinates.map(([x, y], index) => <circle key={monthlyValues[index].label} cx={x} cy={y} r={hoveredMonthIndex === index ? 2.8 : 0} fill="#c8ff52" stroke="#0e110d" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>)}</svg></div></div><div className="mt-1.5 grid grid-cols-[2.5rem_1fr] gap-1"><span/><div className="relative h-3 text-[9px] font-semibold text-muted">{monthlyValues.map((point, index) => <span key={point.label} className="absolute whitespace-nowrap" style={{ left: `${index / Math.max(monthlyValues.length - 1, 1) * 100}%`, transform: `translateX(${index === 0 ? "0" : index === monthlyValues.length - 1 ? "-100" : "-50"}%)` }}>{point.label}</span>)}</div></div></div></section>;
}
