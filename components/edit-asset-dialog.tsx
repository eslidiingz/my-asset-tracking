"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, LoaderCircle, Save, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { deleteAsset, updateAsset, type AssetFormState } from "@/app/actions/assets";
import { AssetGroupSelect } from "@/components/ui/asset-group-select";
import { useToast } from "@/components/ui/toast-provider";
import type { Asset, AssetGroup } from "@/lib/db";

const initialState: AssetFormState = { error: "", success: false };
const categories = ["Stocks", "Crypto", "Cash", "Property", "Mutual Fund", "Gold", "Private Fund", "TSD"] as const;
const colors = ["#c8ff52", "#72ddf7", "#bc8cff", "#ffb86c"];

export function EditAssetDialog({ asset, groups, open, onOpenChange }: { asset: Asset; groups: AssetGroup[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [category, setCategory] = useState(asset.category);
  const [color, setColor] = useState(asset.color);
  const [groupId, setGroupId] = useState(asset.groupId ? String(asset.groupId) : "");
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [state, action, pending] = useActionState(updateAsset, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAsset, initialState);
  const { showToast } = useToast();

  useEffect(() => { if (open) { setCategory(asset.category); setColor(asset.color); setGroupId(asset.groupId ? String(asset.groupId) : ""); } }, [asset, open]);
  useEffect(() => { if (state.success) { showToast("Asset updated.", "success"); onOpenChange(false); } else if (state.error) showToast(state.error, "error"); }, [onOpenChange, showToast, state]);
  useEffect(() => { if (deleteState.success) { showToast("Asset deleted.", "success"); setDeleteConfirmationOpen(false); onOpenChange(false); } else if (deleteState.error) showToast(deleteState.error, "error"); }, [deleteState, onOpenChange, showToast]);
  const priceCurrency = category === "Mutual Fund" || category === "Private Fund" || category === "TSD" ? "THB" : "USD";

  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay dialog-overlay-motion"/><Dialog.Content className="asset-dialog dialog-sheet-motion">
      <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-extrabold tracking-[-.04em]">Edit asset</Dialog.Title><Dialog.Description className="mt-1 text-xs text-muted">Update this position’s details and cost basis.</Dialog.Description></div><Dialog.Close disabled={pending} className="icon-button" aria-label="Close"><X size={17}/></Dialog.Close></div>
      <form key={asset.id} action={action} className="mt-6 space-y-4">
        <input type="hidden" name="id" value={asset.id} autoComplete="off"/>
        <label className="auth-field"><span>Symbol</span><div><input name="symbol" autoComplete="off" required defaultValue={asset.symbol} onChange={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/[^A-Za-z0-9() -]/g, "").toUpperCase(); }} autoCapitalize="characters" autoCorrect="off" maxLength={30} pattern="[A-Za-z0-9() -]+"/></div></label>
        <fieldset><legend className="asset-field-label">Asset class</legend><div className="asset-option-grid" role="radiogroup" aria-label="Asset class">{categories.map((option) => <label key={option} className="asset-option" data-active={category === option}><input type="radio" name="category" value={option} checked={category === option} onChange={() => setCategory(option)} className="sr-only"/>{category === option && <Check size={14}/>} {option}</label>)}</div></fieldset>
        <label className="auth-field"><span>Asset group</span><AssetGroupSelect name="groupId" groups={groups} value={groupId} onValueChange={setGroupId}/></label>
        <div className="grid grid-cols-2 gap-3"><label className="auth-field"><span>{category === "Private Fund" ? "Units (optional)" : "Units"}</span><div><input name="units" autoComplete="off" type="number" required={category !== "Private Fund"} min="0" step="any" defaultValue={asset.units || ""}/></div></label><label className="auth-field"><span>Average price ({priceCurrency}){category === "Private Fund" ? " (optional)" : ""}</span><div><input name="averagePrice" autoComplete="off" type="number" required={category !== "Private Fund"} min="0" step="any" defaultValue={asset.averagePrice || ""}/></div></label></div>
        <label className="auth-field"><span>Total cost ({priceCurrency})</span><div><input name="totalCost" autoComplete="off" type="number" min="0" step="any" defaultValue={asset.totalCost ?? ""} placeholder="Optional — calculated from units × average price"/></div><small className="mt-1 block text-xs text-muted">Leave blank to calculate from units × average price.</small></label>
        {category === "Stocks" || category === "TSD" ? <label className="auth-field"><span>{category === "TSD" ? "Thai" : "US"} dividend yield (%)</span><div><input name="dividendYield" autoComplete="off" type="number" min="0" max="100" step=".01" defaultValue={asset.dividendYield ?? 0}/></div></label> : <fieldset><legend className="asset-field-label">Accent color</legend><input type="hidden" name="color" value={color} autoComplete="off"/><div className="asset-color-grid" role="group" aria-label="Accent color">{colors.map((option) => <button key={option} type="button" className="asset-color" data-active={color === option} aria-label={`Use ${option} accent`} aria-pressed={color === option} onClick={() => setColor(option)} style={{ "--asset-color": option } as React.CSSProperties}>{color === option && <Check size={14}/>}</button>)}</div></fieldset>}
        {(category === "Stocks" || category === "TSD") && <input type="hidden" name="color" value={color} autoComplete="off"/>}
        {state.error && <p role="alert" className="rounded-xl border border-negative/20 bg-negative/10 px-3 py-2.5 text-xs font-semibold text-negative">{state.error}</p>}
        <button disabled={pending || deletePending} className="auth-submit">{pending ? <LoaderCircle size={17} className="animate-spin"/> : <Save size={17}/>} {pending ? "Saving…" : "Save changes"}</button>
        <button type="button" disabled={pending || deletePending} onClick={() => setDeleteConfirmationOpen(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-negative/35 bg-negative/10 text-sm font-extrabold text-negative transition hover:bg-negative/20 disabled:pointer-events-none disabled:opacity-50"><Trash2 size={17}/> Delete asset</button>
      </form>
    </Dialog.Content></Dialog.Portal>
    <Dialog.Root open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}><Dialog.Portal><Dialog.Overlay className="dialog-overlay dialog-overlay-motion z-[60]"/><Dialog.Content className="asset-dialog dialog-sheet-motion z-[61] max-w-sm"><Dialog.Title className="text-xl font-extrabold tracking-[-.04em]">Delete {asset.symbol}?</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-muted">This removes the asset from your portfolio. Its dividend history will be kept.</Dialog.Description>{deleteState.error && <p role="alert" className="mt-4 rounded-xl border border-negative/20 bg-negative/10 px-3 py-2.5 text-xs font-semibold text-negative">{deleteState.error}</p>}<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Dialog.Close disabled={deletePending} className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-semibold transition hover:bg-soft disabled:pointer-events-none disabled:opacity-50">Cancel</Dialog.Close><form action={deleteAction}><input type="hidden" name="id" value={asset.id} autoComplete="off"/><button disabled={deletePending} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-negative px-4 text-sm font-semibold text-white transition hover:bg-[#ff9488] disabled:pointer-events-none disabled:opacity-50 sm:w-auto">{deletePending ? <LoaderCircle size={16} className="animate-spin"/> : <Trash2 size={16}/>} {deletePending ? "Deleting…" : "Delete asset"}</button></form></div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </Dialog.Root>;
}
