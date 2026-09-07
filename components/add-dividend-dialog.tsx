"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect, useState } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";
import { addDividendTransaction, type DividendFormState } from "@/app/actions/assets";
import { DatePicker } from "@/components/ui/date-picker";
import { SymbolCombobox } from "@/components/ui/symbol-combobox";

const initialState: DividendFormState = { error: "", success: false };

export function AddDividendDialog({ symbols }: { symbols: string[] }) {
  const [open, setOpen] = useState(false);
  const [receivedAt, setReceivedAt] = useState("");
  const [state, action, pending] = useActionState(addDividendTransaction, initialState);
  useEffect(() => { if (state.success) setOpen(false); }, [state.success]);

  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild><button className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-[#10140a] transition hover:bg-[#d5ff75]"><Plus size={16}/>Record dividend</button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay dialog-overlay-motion"/><Dialog.Content className="asset-dialog dialog-sheet-motion">
      <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-extrabold tracking-[-.04em]">Record dividend received</Dialog.Title><Dialog.Description className="mt-1 text-xs text-muted">Record the gross amount and any withholding tax for a stock you own.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close"><X size={17}/></Dialog.Close></div>
      <form action={action} className="mt-6 space-y-4">
        <label className="auth-field"><span>Symbol</span><div><SymbolCombobox symbols={symbols}/></div></label>
        <div className="grid grid-cols-2 gap-3"><label className="auth-field"><span>Amount (USD)</span><div><input name="dividendAmount" autoComplete="off" type="number" min="0.01" step="0.01" required placeholder="0.00"/></div></label><label className="auth-field"><span>WHT (USD)</span><div><input name="withholdingTax" autoComplete="off" type="number" min="0" step="0.01" defaultValue="0" required/></div></label></div>
        <div className="auth-field"><span>Dividend received date</span><div className="!block !h-auto !border-0 !bg-transparent !p-0"><DatePicker name="receivedAt" value={receivedAt} onChange={setReceivedAt} required label="Select received date" /></div></div>
        {symbols.length === 0 && <p className="rounded-xl border border-amber/20 bg-amber/10 px-3 py-2.5 text-xs font-semibold text-amber">Add a stock asset before recording a dividend.</p>}
        {state.error && <p role="alert" className="rounded-xl border border-negative/20 bg-negative/10 px-3 py-2.5 text-xs font-semibold text-negative">{state.error}</p>}
        <button disabled={pending || symbols.length === 0} className="auth-submit">{pending ? <LoaderCircle size={17} className="animate-spin"/> : <Plus size={17}/>} {pending ? "Saving…" : "Save dividend"}</button>
      </form>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
