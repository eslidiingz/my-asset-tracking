"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState, useTransition } from "react";
import { BarChart3, LoaderCircle, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateAssetGroupValueTransactions } from "@/app/actions/assets";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toast-provider";
import type { AssetGroup, AssetGroupValueTransaction } from "@/lib/db";
import { cn, formatCurrency } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const chartMonthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
const chartValueFormatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

function toDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function EditGroupValueTransactionDialog({ transactions, groups, recordedAt, onClose }: { transactions: AssetGroupValueTransaction[]; groups: AssetGroup[]; recordedAt: string; onClose: () => void }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [date, setDate] = useState(recordedAt);
  const [values, setValues] = useState<Record<number, string>>(() => Object.fromEntries(transactions.map((transaction) => [transaction.id, String(transaction.totalValue)])));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError("");
    formData.set("updates", JSON.stringify(transactions.map((transaction) => ({ id: transaction.id, totalValue: Number(values[transaction.id]) }))));
    startTransition(async () => {
      const result = await updateAssetGroupValueTransactions(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      showToast("Group-value batch updated.", "success");
      onClose();
      router.refresh();
    });
  }

  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="dialog-overlay dialog-overlay-motion z-[60]"/><Dialog.Content className="asset-dialog asset-picker-dialog dialog-sheet-motion z-[61]"><div className="flex shrink-0 items-start justify-between gap-4 border-b border-line pb-5"><div><Dialog.Title className="text-2xl font-extrabold tracking-[-.04em]">Edit group-value batch</Dialog.Title><Dialog.Description className="mt-1 text-sm leading-6 text-muted">Correct every group value recorded for this date. Changes update the historical charts only.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close"><X size={17}/></Dialog.Close></div><form action={submit} className="mt-5 flex min-h-0 flex-1 flex-col gap-4"><div className="min-h-0 flex-1 overflow-y-auto"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{transactions.map((transaction) => { const group = groups.find((item) => item.id === transaction.groupId); return <label key={transaction.id} className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: group?.color ?? "#c8ff52" }}/><span className="min-w-0 flex-1 truncate text-sm font-bold">{group?.name ?? "Deleted group"}</span><div className="relative w-40 shrink-0"><input type="number" min="0" step="0.01" required value={values[transaction.id] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [transaction.id]: event.target.value }))} className="h-10 w-full rounded-lg border border-line bg-surface px-3 pr-12 text-sm font-semibold outline-none transition focus:border-accent"/><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-extrabold text-muted">THB</span></div></label>; })}</div></div><div className="flex shrink-0 flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-end sm:justify-between"><label className="block w-full sm:max-w-xs"><span className="mb-1.5 block text-xs font-bold text-muted">Value as of</span><DatePicker name="recordedAt" value={date} onChange={setDate} required label="Select update date"/></label><div className="flex flex-col-reverse gap-2 sm:flex-row"><Dialog.Close className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:bg-soft">Cancel</Dialog.Close><button disabled={pending || Object.values(values).some((value) => value.trim() === "")} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-extrabold text-[#10140a] disabled:opacity-50">{pending && <LoaderCircle size={16} className="animate-spin"/>}Save batch</button></div></div>{error && <p role="alert" className="shrink-0 text-xs font-semibold text-negative">{error}</p>}</form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function GroupValueHistory({ groups, transactions }: { groups: AssetGroup[]; transactions: AssetGroupValueTransaction[] }) {
  const availableGroups = groups.filter((group) => transactions.some((transaction) => transaction.groupId === group.id));
  const [groupId, setGroupId] = useState<number | null>(availableGroups[0]?.id ?? null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [historyYear, setHistoryYear] = useState<number | "all">("all");
  const [historyMonth, setHistoryMonth] = useState<number | "all">("all");
  useEffect(() => {
    if (!availableGroups.some((group) => group.id === groupId)) setGroupId(availableGroups[0]?.id ?? null);
  }, [availableGroups, groupId]);
  const points = useMemo(() => transactions.filter((transaction) => transaction.groupId === groupId), [groupId, transactions]);
  const selectedGroup = groups.find((group) => group.id === groupId);
  const historyYears = useMemo(() => [...new Set(points.map((point) => new Date(point.recordedAt).getFullYear()))].sort((a, b) => b - a), [points]);
  const historyMonths = useMemo(() => historyYear === "all" ? [] : [...new Set(points.filter((point) => new Date(point.recordedAt).getFullYear() === historyYear).map((point) => new Date(point.recordedAt).getMonth()))].sort((a, b) => a - b), [historyYear, points]);
  const filteredHistory = points.filter((point) => (historyYear === "all" || new Date(point.recordedAt).getFullYear() === historyYear) && (historyMonth === "all" || new Date(point.recordedAt).getMonth() === historyMonth));
  const chartPoints = useMemo(() => {
    const latestPointByMonth = new Map<string, { point: AssetGroupValueTransaction; index: number }>();

    points.forEach((point, index) => {
      const date = new Date(point.recordedAt);
      const month = `${date.getFullYear()}-${date.getMonth()}`;
      latestPointByMonth.set(month, { point, index });
    });

    return [...latestPointByMonth.values()].slice(-6).map(({ point }) => point);
  }, [points]);
  const { path, area, yAxisLabels } = useMemo(() => {
    const values = chartPoints.map((point) => point.totalValue);
    const min = Math.min(...values) * .96;
    const max = Math.max(...values) * 1.02;
    const range = max - min || 1;
    const coordinates = values.map((value, index) => [index / Math.max(values.length - 1, 1) * 100, 92 - ((value - min) / range * 80)] as const);
    const line = coordinates.map(([x, y], index) => `${index ? "L" : "M"}${x},${y}`).join(" ");
    return {
      path: line,
      area: `${line} L100,100 L0,100 Z`,
      yAxisLabels: [
        { value: max, position: 12 },
        { value: min + range / 2, position: 52 },
        { value: min, position: 92 },
      ],
    };
  }, [chartPoints]);

  if (availableGroups.length === 0) return <section className="bento-card !mt-3 md:!mt-4"><div className="flex items-start gap-3"><span className="icon-button"><BarChart3 size={17}/></span><div><p className="label">Group value history</p><h2 className="mt-1 text-lg font-extrabold tracking-[-.03em]">No group valuations yet</h2><p className="mt-1 text-xs leading-5 text-muted">Record an update from Assets to see each group&apos;s value over time here.</p></div></div></section>;

  const latest = points.at(-1);
  return <><section className="bento-card !mt-3 md:!mt-4"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="icon-button"><BarChart3 size={17}/></span><p className="label">Group value history</p></div><p className="mt-3 text-2xl font-extrabold tracking-[-.05em]">{formatCurrency(latest?.totalValue ?? 0, "THB")}</p><p className="mt-1 text-[11px] text-muted">{selectedGroup?.name} · last updated {latest ? dateFormatter.format(latest.recordedAt) : "—"}</p></div><Tabs value={String(groupId ?? "")} onValueChange={(value) => { setGroupId(Number(value)); setHistoryYear("all"); setHistoryMonth("all"); }} variant="segment" className="max-w-full"><TabsList className="flex max-w-full gap-1.5 overflow-x-auto rounded-none border-0 bg-transparent p-0 [&>div]:shrink-0">{availableGroups.map((group) => <TabsTrigger key={group.id} value={String(group.id)} className={groupId === group.id ? "h-8 whitespace-nowrap rounded-lg px-2.5 text-xs font-extrabold text-[#10140a] hover:text-[#10140a]" : "h-8 whitespace-nowrap rounded-lg bg-soft px-2.5 text-xs font-bold text-muted hover:text-ink"} indicatorClassName="bg-accent"><span className="mr-1.5 inline-block size-1.5 rounded-full" style={{ backgroundColor: group.color }}/>{group.name}</TabsTrigger>)}</TabsList></Tabs></div>
    <div className="relative mt-6 h-40"><div className="absolute inset-y-0 left-0 w-10 text-right text-[9px] font-semibold text-muted">{yAxisLabels.map((label) => <span key={label.position} className="absolute right-0 -translate-y-1/2 whitespace-nowrap" style={{ top: `${label.position}%` }}>{chartValueFormatter.format(label.value)}</span>)}</div><div className="absolute inset-y-0 left-12 right-0"><div className="absolute inset-0 chart-grid"/><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-label={`${selectedGroup?.name} value history`} role="img"><defs><linearGradient id="group-value-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={selectedGroup?.color ?? "#c8ff52"} stopOpacity=".3"/><stop offset="1" stopColor={selectedGroup?.color ?? "#c8ff52"} stopOpacity="0"/></linearGradient></defs><path d={area} fill="url(#group-value-fill)"/><path d={path} fill="none" stroke={selectedGroup?.color ?? "#c8ff52"} strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/></svg><div className="absolute inset-x-0 bottom-0 text-[9px] font-semibold text-muted">{chartPoints.map((point, index) => <span key={point.id} title={dateFormatter.format(point.recordedAt)} className={cn("absolute bottom-0 whitespace-nowrap", index === 0 ? "translate-x-0" : index === chartPoints.length - 1 ? "-translate-x-full" : "-translate-x-1/2")} style={{ left: `${index / Math.max(chartPoints.length - 1, 1) * 100}%` }}>{chartMonthFormatter.format(point.recordedAt)}</span>)}</div></div></div>
  </section></>;
}
