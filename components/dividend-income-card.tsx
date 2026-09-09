"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type DividendTransaction = { id: number; dividendAmount: number; withholdingTax: number; receivedAt: string };

function formatBaht(value: number) {
  return formatCurrency(value, "THB").replace("THB", "฿");
}

export function DividendIncomeCard({ transactions, usdToThbRate }: { transactions: DividendTransaction[]; usdToThbRate: number | null }) {
  const years = useMemo(() => [...new Set(transactions.map((transaction) => new Date(transaction.receivedAt).getUTCFullYear()))].sort((a, b) => b - a), [transactions]);
  const currentYear = new Date().getUTCFullYear();
  const [year, setYear] = useState<number | "all">(years.includes(currentYear) ? currentYear : "all");
  const filteredTransactions = year === "all" ? transactions : transactions.filter((transaction) => new Date(transaction.receivedAt).getUTCFullYear() === year);
  const netIncome = filteredTransactions.reduce((sum, transaction) => sum + transaction.dividendAmount - transaction.withholdingTax, 0);

  return <article className="bento-card bento-insight !mt-3 md:!mt-4"><div className="flex items-center gap-2 text-accent"><Sparkles size={16}/><p className="label !text-accent">Dividend income</p></div><div className="mt-4 flex max-w-full gap-1.5 overflow-x-auto pb-1" aria-label="Dividend income period filter"><button type="button" aria-pressed={year === "all"} onClick={() => setYear("all")} className={year === "all" ? "shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-extrabold text-[#10140a]" : "shrink-0 rounded-full border border-line bg-soft px-3 py-1.5 text-xs font-bold text-muted hover:text-ink"}>All time</button>{years.map((value) => <button key={value} type="button" aria-pressed={year === value} onClick={() => setYear(value)} className={year === value ? "shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-extrabold text-[#10140a]" : "shrink-0 rounded-full border border-line bg-soft px-3 py-1.5 text-xs font-bold text-muted hover:text-ink"}>{value}</button>)}</div><p className="mt-5 text-3xl font-extrabold tracking-[-.055em]">{formatCurrency(netIncome)}</p>{usdToThbRate !== null && <p className="mt-1 text-sm font-bold text-muted">{formatBaht(netIncome * usdToThbRate)}</p>}<p className="mt-2 truncate text-xs leading-relaxed text-muted">Net dividends received {year === "all" ? "across all recorded years" : `in ${year}`} from {filteredTransactions.length} payment{filteredTransactions.length === 1 ? "" : "s"}.</p><Link href="/dividends" className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-accent">View income details <ChevronRight size={13}/></Link></article>;
}
