"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect, useState } from "react";
import { Check, LoaderCircle, Plus, X } from "lucide-react";
import { addAsset, type AssetFormState } from "@/app/actions/assets";
import type { AssetGroup } from "@/lib/db";
import { AssetGroupSelect } from "@/components/ui/asset-group-select";

const initialState: AssetFormState = { error: "", success: false };
const categories = ["Stocks", "Crypto", "Cash", "Property"];
const colors = ["#c8ff52", "#72ddf7", "#bc8cff", "#ffb86c"];
type FieldName = "symbol" | "units" | "averagePrice" | "dividendYield";
type FieldErrors = Partial<Record<FieldName, string>>;

function validate(formData: FormData, category: string): FieldErrors {
  const errors: FieldErrors = {};
  const symbol = String(formData.get("symbol") ?? "").trim();
  const units = String(formData.get("units") ?? "").trim();
  const averagePrice = String(formData.get("averagePrice") ?? "").trim();
  const dividendYield = String(formData.get("dividendYield") ?? "").trim();
  if (!symbol) errors.symbol = "Enter a ticker symbol.";
  else if (!/^[A-Za-z]{1,12}$/.test(symbol)) errors.symbol = "Use up to 12 English letters.";
  if (!units) errors.units = "Enter the number of units.";
  else if (!Number.isFinite(Number(units)) || Number(units) <= 0) errors.units = "Units must be greater than 0.";
  if (!averagePrice) errors.averagePrice = "Enter your average price.";
  else if (!Number.isFinite(Number(averagePrice)) || Number(averagePrice) < 0) errors.averagePrice = "Average price cannot be negative.";
  if (category === "Stocks" && dividendYield && (!Number.isFinite(Number(dividendYield)) || Number(dividendYield) < 0 || Number(dividendYield) > 100)) errors.dividendYield = "Use a value between 0 and 100.";
  return errors;
}

export function AddAssetDialog({ groups }: { groups: AssetGroup[] }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Stocks");
  const [color, setColor] = useState("#c8ff52");
  const [groupId, setGroupId] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, action, pending] = useActionState(addAsset, initialState);
  useEffect(() => { if (state.success) setOpen(false); }, [state.success]);
  useEffect(() => { if (!open) setErrors({}); }, [open]);
  function clearError(field: FieldName) { setErrors((current) => ({ ...current, [field]: undefined })); }
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const nextErrors = validate(new FormData(event.currentTarget), category);
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault(); setErrors(nextErrors);
      event.currentTarget.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
    }
  }
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild><button className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-3 text-sm font-semibold text-[#10140a] transition hover:bg-[#d5ff75] sm:px-4"><Plus size={16}/><span className="hidden min-[380px]:inline">Add asset</span></button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay dialog-overlay-motion"/><Dialog.Content className="asset-dialog dialog-sheet-motion">
      <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-extrabold tracking-[-.04em]">Add an asset</Dialog.Title><Dialog.Description className="mt-1 text-xs text-muted">A snapshot is saved whenever your portfolio changes.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close"><X size={17}/></Dialog.Close></div>
      <form action={action} noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Symbol" name="symbol" error={errors.symbol} onChange={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/[^A-Za-z]/g, "").toUpperCase(); clearError("symbol"); }} placeholder="AAPL" autoCapitalize="characters" autoCorrect="off" inputMode="text" lang="en" pattern="[A-Za-z]+" />
        <fieldset><legend className="asset-field-label">Asset class</legend><input type="hidden" name="category" value={category} autoComplete="off"/><div className="asset-option-grid" role="group" aria-label="Asset class">{categories.map((option) => <button key={option} type="button" aria-pressed={category === option} className="asset-option" data-active={category === option} onClick={() => setCategory(option)}>{category === option && <Check size={14}/>} {option}</button>)}</div></fieldset>
        <label className="auth-field"><span>Asset group</span><AssetGroupSelect name="groupId" groups={groups} value={groupId} onValueChange={setGroupId}/></label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Units" name="units" type="number" error={errors.units} onChange={() => clearError("units")} placeholder="0" min="0" step="any" />
          <Field label="Average price (USD)" name="averagePrice" type="number" error={errors.averagePrice} onChange={() => clearError("averagePrice")} placeholder="0.00" min="0" step="any" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {category === "Stocks" ? <div className="col-span-2"><Field label="US dividend yield (%)" name="dividendYield" type="number" error={errors.dividendYield} onChange={() => clearError("dividendYield")} placeholder="e.g. 0.44" min="0" max="100" step=".01" required={false} /></div> : <fieldset className="col-span-2"><legend className="asset-field-label">Accent color</legend><input type="hidden" name="color" value={color} autoComplete="off"/><div className="asset-color-grid" role="group" aria-label="Accent color">{colors.map((option) => <button key={option} type="button" className="asset-color" data-active={color === option} aria-label={`Use ${option} accent`} aria-pressed={color === option} onClick={() => setColor(option)} style={{ "--asset-color": option } as React.CSSProperties}>{color === option && <Check size={14}/>}</button>)}</div></fieldset>}
        </div>
        {state.error && <p role="alert" className="rounded-xl border border-negative/20 bg-negative/10 px-3 py-2.5 text-xs font-semibold text-negative">{state.error}</p>}
        <button disabled={pending} className="auth-submit">{pending ? <LoaderCircle size={17} className="animate-spin"/> : <Plus size={17}/>} {pending ? "Saving…" : "Save asset"}</button>
      </form>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}

function Field({ label, name, error, onChange, required = true, ...inputProps }: { label: string; name: FieldName; error?: string; onChange: React.ChangeEventHandler<HTMLInputElement>; required?: boolean } & React.ComponentProps<"input">) {
  const errorId = `${name}-error`;
  return <label className="auth-field" data-invalid={Boolean(error)}><span>{label}</span><div><input name={name} autoComplete="off" required={required} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={onChange} {...inputProps}/></div>{error && <small id={errorId} className="field-error">{error}</small>}</label>;
}
