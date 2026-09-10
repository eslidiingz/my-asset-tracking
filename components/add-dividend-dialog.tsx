"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect, useState } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";
import { addDividendTransaction, type DividendFormState } from "@/app/actions/assets";
import { DatePicker } from "@/components/ui/date-picker";
import { SymbolCombobox } from "@/components/ui/symbol-combobox";
import { useToast } from "@/components/ui/toast-provider";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";

const initialState: DividendFormState = { error: "", success: false };

type DividendAsset = { symbol: string; category: "Stocks" | "TSD" };

export function AddDividendDialog({ assets }: { assets: DividendAsset[] }) {
  const [open, setOpen] = useState(false);
  const [receivedAt, setReceivedAt] = useState("");
  const [currency, setCurrency] = useState<"USD" | "THB">("USD");
  const [state, action, pending] = useActionState(addDividendTransaction, initialState);
  const { showToast } = useToast();
  useEffect(() => { if (state.success) { showToast("Dividend recorded.", "success"); setOpen(false); } else if (state.error) showToast(state.error, "error"); }, [showToast, state]);

  const symbols = assets.map((item) => item.symbol);

  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild><button className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-[#10140a] transition hover:bg-[#d5ff75]"><Plus size={16}/>Record dividend</button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay dialog-overlay-motion"/><Dialog.Content className="asset-dialog dialog-sheet-motion">
      <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-extrabold tracking-[-.04em]">Record dividend received</Dialog.Title><Dialog.Description className="mt-1 text-xs text-muted">Record a current or historical payment, even if you no longer hold the asset.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close"><X size={17}/></Dialog.Close></div>
      <form action={action} className="mt-6 space-y-4">
        <label className="auth-field"><span>Symbol</span><div><SymbolCombobox symbols={symbols} onValueChange={(value) => { const asset = assets.find((item) => item.symbol === value); if (asset) setCurrency(asset.category === "TSD" ? "THB" : "USD"); }}/></div></label>
        <fieldset><legend className="asset-field-label">Payment currency</legend><input type="hidden" name="currency" value={currency}/><Tabs value={currency} onValueChange={(value) => setCurrency(value as "USD" | "THB")} variant="segment" className="w-full"><TabsList className="w-full rounded-xl border border-line bg-canvas p-1 [&>div]:flex-1"><TabsTrigger value="USD" className={currency === "USD" ? "h-10 w-full rounded-lg text-sm font-extrabold text-[#10140a] hover:text-[#10140a]" : "h-10 w-full rounded-lg text-sm font-bold text-muted hover:text-ink"} indicatorClassName="bg-accent">USD</TabsTrigger><TabsTrigger value="THB" className={currency === "THB" ? "h-10 w-full rounded-lg text-sm font-extrabold text-[#10140a] hover:text-[#10140a]" : "h-10 w-full rounded-lg text-sm font-bold text-muted hover:text-ink"} indicatorClassName="bg-accent">THB</TabsTrigger></TabsList></Tabs></fieldset>
        <div className="grid grid-cols-2 gap-3"><label className="auth-field"><span>Amount ({currency})</span><div><input name="dividendAmount" autoComplete="off" type="number" min="0.01" step="0.01" required placeholder="0.00"/></div></label><label className="auth-field"><span>WHT ({currency})</span><div><input name="withholdingTax" autoComplete="off" type="number" min="0" step="0.01" placeholder="0.00"/></div></label></div>
        <div className="auth-field"><span>Dividend received date</span><div className="!block !h-auto !border-0 !bg-transparent !p-0"><DatePicker name="receivedAt" value={receivedAt} onChange={setReceivedAt} required label="Select received date" /></div></div>
        {state.error && <p role="alert" className="rounded-xl border border-negative/20 bg-negative/10 px-3 py-2.5 text-xs font-semibold text-negative">{state.error}</p>}
        <button disabled={pending} className="auth-submit">{pending ? <LoaderCircle size={17} className="animate-spin"/> : <Plus size={17}/>} {pending ? "Saving…" : "Save dividend"}</button>
      </form>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
