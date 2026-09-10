"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import { LoaderCircle, X } from "lucide-react";
import { updateDividendTransaction, type DividendFormState } from "@/app/actions/assets";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toast-provider";

const initialState: DividendFormState = { error: "", success: false };
type Transaction = { id: number; symbol: string; currency: "USD" | "THB"; dividendAmount: number; withholdingTax: number; receivedAt: string };

export function EditDividendDialog({ transaction, trigger }: { transaction: Transaction; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState(transaction.currency);
  const [receivedAt, setReceivedAt] = useState(new Date(transaction.receivedAt).toISOString().slice(0, 10));
  const [state, action, pending] = useActionState(updateDividendTransaction, initialState);
  const { showToast } = useToast();
  useEffect(() => { if (state.success) { showToast("Dividend updated.", "success"); setOpen(false); } else if (state.error) showToast(state.error, "error"); }, [showToast, state]);

  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild>{trigger}</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="dialog-overlay dialog-overlay-motion"/><Dialog.Content className="asset-dialog dialog-sheet-motion"><div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-extrabold tracking-[-.04em]">Edit dividend</Dialog.Title><Dialog.Description className="mt-1 text-xs text-muted">Correct a recorded dividend payment.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close"><X size={17}/></Dialog.Close></div><form action={action} className="mt-6 space-y-4"><input type="hidden" name="id" value={transaction.id}/><label className="auth-field"><span>Symbol</span><div><input name="symbol" defaultValue={transaction.symbol} required autoComplete="off"/></div></label><fieldset><legend className="asset-field-label">Payment currency</legend><input type="hidden" name="currency" value={currency}/><div className="flex rounded-xl border border-line bg-canvas p-1"><button type="button" onClick={() => setCurrency("USD")} className={currency === "USD" ? "h-10 flex-1 rounded-lg bg-accent text-sm font-extrabold text-[#10140a]" : "h-10 flex-1 rounded-lg text-sm font-bold text-muted hover:text-ink"}>USD</button><button type="button" onClick={() => setCurrency("THB")} className={currency === "THB" ? "h-10 flex-1 rounded-lg bg-accent text-sm font-extrabold text-[#10140a]" : "h-10 flex-1 rounded-lg text-sm font-bold text-muted hover:text-ink"}>THB</button></div></fieldset><div className="grid grid-cols-2 gap-3"><label className="auth-field"><span>Amount ({currency})</span><div><input name="dividendAmount" type="number" min="0.01" step="0.01" defaultValue={transaction.dividendAmount} required/></div></label><label className="auth-field"><span>WHT ({currency})</span><div><input name="withholdingTax" type="number" min="0" step="0.01" defaultValue={transaction.withholdingTax || ""} placeholder="0.00"/></div></label></div><div className="auth-field"><span>Dividend received date</span><div className="!block !h-auto !border-0 !bg-transparent !p-0"><DatePicker name="receivedAt" value={receivedAt} onChange={setReceivedAt} required label="Select received date"/></div></div>{state.error && <p role="alert" className="text-xs font-semibold text-negative">{state.error}</p>}<button disabled={pending} className="auth-submit">{pending && <LoaderCircle size={17} className="animate-spin"/>}{pending ? "Saving…" : "Save changes"}</button></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
