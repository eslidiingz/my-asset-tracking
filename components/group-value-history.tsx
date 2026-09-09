"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState, useTransition } from "react";
import { BarChart3, LoaderCircle, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateAssetGroupValueTransactions } from "@/app/actions/assets";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toast-provider";
import type { AssetGroup, AssetGroupValueTransaction } from "@/lib/db";
import { cn, formatCurrency } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

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
  useEffect(() => {
    if (!availableGroups.some((group) => group.id === groupId)) setGroupId(availableGroups[0]?.id ?? null);
  }, [availableGroups, groupId]);
  const points = useMemo(() => transactions.filter((transaction) => transaction.groupId === groupId), [groupId, transactions]);
  const selectedGroup = groups.find((group) => group.id === groupId);
  const { path, area } = useMemo(() => {
    const values = points.map((point) => point.totalValue);
    const min = Math.min(...values) * .96;
    const max = Math.max(...values) * 1.02;
    const range = max - min || 1;
    const coordinates = values.map((value, index) => [index / Math.max(values.length - 1, 1) * 100, 92 - ((value - min) / range * 80)] as const);
    const line = coordinates.map(([x, y], index) => `${index ? "L" : "M"}${x},${y}`).join(" ");
    return { path: line, area: `${line} L100,100 L0,100 Z` };
  }, [points]);

  if (availableGroups.length === 0) return <section className="bento-card !mt-3 md:!mt-4"><div className="flex items-start gap-3"><span className="icon-button"><BarChart3 size={17}/></span><div><p className="label">Group value history</p><h2 className="mt-1 text-lg font-extrabold tracking-[-.03em]">No group valuations yet</h2><p className="mt-1 text-xs leading-5 text-muted">Record an update from Assets to see each group&apos;s value over time here.</p></div></div></section>;

  const latest = points.at(-1);
  return <><section className="bento-card !mt-3 md:!mt-4"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="icon-button"><BarChart3 size={17}/></span><p className="label">Group value history</p></div><p className="mt-3 text-2xl font-extrabold tracking-[-.05em]">{formatCurrency(latest?.totalValue ?? 0, "THB")}</p><p className="mt-1 text-[11px] text-muted">{selectedGroup?.name} · last updated {latest ? dateFormatter.format(latest.recordedAt) : "—"}</p></div><div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-soft p-1">{availableGroups.map((group) => <button key={group.id} type="button" aria-pressed={groupId === group.id} onClick={() => setGroupId(group.id)} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition", groupId === group.id ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}><span className="mr-1.5 inline-block size-1.5 rounded-full" style={{ backgroundColor: group.color }}/>{group.name}</button>)}</div></div>
    <div className="relative mt-6 h-40"><div className="absolute inset-0 chart-grid"/><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-label={`${selectedGroup?.name} value history`} role="img"><defs><linearGradient id="group-value-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={selectedGroup?.color ?? "#c8ff52"} stopOpacity=".3"/><stop offset="1" stopColor={selectedGroup?.color ?? "#c8ff52"} stopOpacity="0"/></linearGradient></defs><path d={area} fill="url(#group-value-fill)"/><path d={path} fill="none" stroke={selectedGroup?.color ?? "#c8ff52"} strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/></svg><div className="absolute bottom-0 flex w-full justify-between text-[9px] font-semibold text-muted">{points.filter((_, index) => index === 0 || index === points.length - 1 || (points.length > 2 && index === Math.floor(points.length / 2))).map((point) => <span key={point.id}>{dateFormatter.format(point.recordedAt)}</span>)}</div></div>
    <div className="mt-6 border-t border-line pt-4"><div className="mb-2 flex items-center justify-between"><p className="text-xs font-bold text-muted">Recorded batches</p><p className="text-[11px] text-muted">{points.length} entries</p></div><div className="max-h-52 space-y-2 overflow-y-auto pr-1">{[...points].reverse().map((transaction) => <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-3 py-2.5"><div><p className="text-sm font-bold">{formatCurrency(transaction.totalValue, "THB")}</p><p className="mt-0.5 text-[11px] text-muted">{dateFormatter.format(transaction.recordedAt)} · batch date</p></div><button type="button" onClick={() => setEditingDate(toDateValue(transaction.recordedAt))} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-soft px-2.5 text-xs font-bold text-muted transition hover:text-ink"><Pencil size={13}/>Edit batch</button></div>)}</div></div>
  </section>{editingDate && <EditGroupValueTransactionDialog transactions={transactions.filter((transaction) => toDateValue(transaction.recordedAt) === editingDate)} groups={groups} recordedAt={editingDate} onClose={() => setEditingDate(null)}/>}</>;
}
