"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { formatCurrency } from "@/lib/utils";

type DividendTransaction = { id: number; currency: "USD" | "THB"; dividendAmount: number; withholdingTax: number; receivedAt: string };

function formatBaht(value: number) {
  return formatCurrency(value, "THB").replace("THB", "฿");
}

export function DividendIncomeCard({ transactions, usdToThbRate }: { transactions: DividendTransaction[]; usdToThbRate: number | null }) {
  const years = useMemo(() => [...new Set(transactions.map((transaction) => new Date(transaction.receivedAt).getUTCFullYear()))].sort((a, b) => b - a), [transactions]);
  const currentYear = new Date().getUTCFullYear();
  const [year, setYear] = useState<number | "all">(years.includes(currentYear) ? currentYear : "all");
  const filteredTransactions = year === "all" ? transactions : transactions.filter((transaction) => new Date(transaction.receivedAt).getUTCFullYear() === year);
  const usdIncome = filteredTransactions.filter((transaction) => transaction.currency === "USD").reduce((sum, transaction) => sum + transaction.dividendAmount - transaction.withholdingTax, 0);
  const thbIncome = filteredTransactions.filter((transaction) => transaction.currency === "THB").reduce((sum, transaction) => sum + transaction.dividendAmount - transaction.withholdingTax, 0);
  const totalThb = usdToThbRate === null ? null : thbIncome + usdIncome * usdToThbRate;

  return <article className="bento-card bento-insight !mt-3 md:!mt-4"><div className="flex items-center gap-2 text-accent"><Sparkles size={16}/><p className="label !text-accent">Dividend income</p></div><Tabs value={String(year)} onValueChange={(value) => setYear(value === "all" ? "all" : Number(value))} variant="segment" className="mt-4"><TabsList className="flex w-full gap-1.5 overflow-x-auto rounded-none border-0 bg-transparent p-0 [&>div]:shrink-0"><TabsTrigger value="all" className={year === "all" ? "h-8 whitespace-nowrap rounded-lg px-2.5 text-xs font-extrabold text-[#10140a] hover:text-[#10140a]" : "h-8 whitespace-nowrap rounded-lg bg-soft px-2.5 text-xs font-bold text-muted hover:text-ink"} indicatorClassName="bg-accent">All time</TabsTrigger>{years.map((value) => <TabsTrigger key={value} value={String(value)} className={year === value ? "h-8 whitespace-nowrap rounded-lg px-2.5 text-xs font-extrabold text-[#10140a] hover:text-[#10140a]" : "h-8 whitespace-nowrap rounded-lg bg-soft px-2.5 text-xs font-bold text-muted hover:text-ink"} indicatorClassName="bg-accent">{value}</TabsTrigger>)}</TabsList></Tabs><div className="mt-5 border-b border-line pb-3"><p className="label">Total in Thai baht</p><p className="mt-1 text-xl font-extrabold tracking-[-.04em]">{totalThb === null ? "Set USD → THB rate" : formatBaht(totalThb)}</p>{usdToThbRate !== null && <p className="mt-1 text-[11px] font-semibold text-muted">{formatBaht(usdIncome * usdToThbRate)} from USD + {formatBaht(thbIncome)} Thai income</p>}</div><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="label">USD income</p><p className="mt-1 text-2xl font-extrabold tracking-[-.05em]">{formatCurrency(usdIncome)}</p></div><div className="border-l border-line pl-3"><p className="label">Thai income</p><p className="mt-1 text-2xl font-extrabold tracking-[-.05em]">{formatBaht(thbIncome)}</p></div></div><p className="mt-3 truncate text-xs leading-relaxed text-muted">Net dividends received {year === "all" ? "across all recorded years" : `in ${year}`} from {filteredTransactions.length} payment{filteredTransactions.length === 1 ? "" : "s"}.</p><Link href="/dividends" className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold text-accent">View income details <ChevronRight size={13}/></Link></article>;
}
