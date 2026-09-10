"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LoaderCircle, TrendingUp, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAssetGroupValues } from "@/app/actions/assets";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toast-provider";
import type { AssetGroup } from "@/lib/db";

function todayValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export function UpdateGroupValueDialog({ groups }: { groups: AssetGroup[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<number, string>>({});
  const [recordedAt, setRecordedAt] = useState(todayValue);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const updates = groups.flatMap((group) => values[group.id]?.trim() ? [{ groupId: group.id, totalValue: Number(values[group.id]) }] : []);
    formData.set("updates", JSON.stringify(updates));
    setError("");
    startTransition(async () => {
      const result = await updateAssetGroupValues(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      showToast(`${updates.length} total asset ${updates.length === 1 ? "value" : "values"} updated and saved to history.`, "success");
      setOpen(false);
      router.refresh();
    });
  }

  return <Dialog.Root open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (nextOpen) { setValues({}); setError(""); } }}>
    <Dialog.Trigger asChild><button type="button" disabled={groups.length === 0} className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-bold text-muted transition hover:bg-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"><TrendingUp size={15}/>Update total asset values</button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay dialog-overlay-motion"/><Dialog.Content className="asset-dialog asset-picker-dialog dialog-sheet-motion">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line pb-5"><div><Dialog.Title className="text-2xl font-extrabold tracking-[-.04em]">Update total asset values</Dialog.Title><Dialog.Description className="mt-1 text-sm leading-6 text-muted">Enter total asset values for one or more groups. All entries use the same date and are saved together, with one history transaction per group.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close"><X size={17}/></Dialog.Close></div>
      <form action={submit} className="mt-5 flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex min-h-0 flex-1 flex-col"><div className="mb-2 flex shrink-0 items-center justify-between gap-3"><span className="text-xs font-bold text-muted">Total asset values</span><span className="text-[11px] text-muted">Leave a group blank to skip it.</span></div><div className="min-h-0 flex-1 overflow-y-auto pb-2"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{groups.map((group) => <label key={group.id} className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: group.color }}/><span className="min-w-0 flex-1 truncate text-sm font-bold">{group.name}</span><div className="relative w-40 shrink-0"><input type="number" min="0" step="0.01" value={values[group.id] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [group.id]: event.target.value }))} placeholder="Skip" autoComplete="off" aria-label={`${group.name} total asset value in Thai baht`} className="h-10 w-full rounded-lg border border-line bg-surface px-3 pr-12 text-sm font-semibold outline-none transition focus:border-accent"/><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-extrabold text-muted">THB</span></div></label>)}</div></div></div>
        <div className="flex shrink-0 flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-end sm:justify-between"><label className="block w-full sm:max-w-xs"><span className="mb-1.5 block text-xs font-bold text-muted">Value as of</span><DatePicker name="recordedAt" value={recordedAt} onChange={setRecordedAt} required label="Select update date"/></label><div className="flex flex-col-reverse gap-2 sm:flex-row"><Dialog.Close className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:bg-soft">Cancel</Dialog.Close><button disabled={pending || !Object.values(values).some((value) => value.trim() !== "") || !recordedAt} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-extrabold text-[#10140a] disabled:opacity-50">{pending ? <LoaderCircle size={16} className="animate-spin"/> : <TrendingUp size={16}/>}Save selected values</button></div></div>
        {error && <p role="alert" className="shrink-0 text-xs font-semibold text-negative">{error}</p>}
      </form>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
