"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect, useState } from "react";
import { Check, LoaderCircle, Plus, X } from "lucide-react";
import { addAsset, type AssetFormState } from "@/app/actions/assets";
import type { AssetGroup } from "@/lib/db";
import { AssetGroupSelect } from "@/components/ui/asset-group-select";
import { useToast } from "@/components/ui/toast-provider";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";

const initialState: AssetFormState = { error: "", success: false };
const categories = ["Stocks", "Crypto", "Mutual Fund", "Gold", "Private Fund", "TSD"];
const colors = ["#c8ff52", "#72ddf7", "#bc8cff", "#ffb86c"];
type FieldName = "symbol" | "units" | "averagePrice" | "totalCost" | "dividendYield";
type FieldErrors = Partial<Record<FieldName, string>>;

function validate(formData: FormData, category: string): FieldErrors {
  const errors: FieldErrors = {};
  const symbol = String(formData.get("symbol") ?? "").trim();
  const units = String(formData.get("units") ?? "").trim();
  const averagePrice = String(formData.get("averagePrice") ?? "").trim();
  const totalCost = String(formData.get("totalCost") ?? "").trim();
  const dividendYield = String(formData.get("dividendYield") ?? "").trim();
  if (!symbol) errors.symbol = "Enter a ticker symbol.";
  else if (!/^[A-Za-z0-9() -]{1,30}$/.test(symbol)) errors.symbol = "Use up to 30 English letters, numbers, spaces, parentheses, or hyphens.";
  if (category !== "Private Fund" && !units) errors.units = "Enter the number of units.";
  else if (units && (!Number.isFinite(Number(units)) || (category !== "Private Fund" && Number(units) <= 0) || (category === "Private Fund" && Number(units) < 0))) errors.units = category === "Private Fund" ? "Units cannot be negative." : "Units must be greater than 0.";
  if (category !== "Private Fund" && !averagePrice) errors.averagePrice = "Enter your average price.";
  else if (averagePrice && (!Number.isFinite(Number(averagePrice)) || Number(averagePrice) < 0)) errors.averagePrice = "Average price cannot be negative.";
  if (totalCost && (!Number.isFinite(Number(totalCost)) || Number(totalCost) < 0)) errors.totalCost = "Total cost cannot be negative.";
  if ((category === "Stocks" || category === "TSD") && dividendYield && (!Number.isFinite(Number(dividendYield)) || Number(dividendYield) < 0 || Number(dividendYield) > 100)) errors.dividendYield = "Use a value between 0 and 100.";
  return errors;
}

export function AddAssetDialog({ groups }: { groups: AssetGroup[] }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Stocks");
  const [color, setColor] = useState("#c8ff52");
  const [groupId, setGroupId] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, action, pending] = useActionState(addAsset, initialState);
  const { showToast } = useToast();
  useEffect(() => { if (state.success) { showToast("Asset added.", "success"); setOpen(false); } else if (state.error) showToast(state.error, "error"); }, [showToast, state]);
  useEffect(() => { if (!open) setErrors({}); }, [open]);
  function clearError(field: FieldName) { setErrors((current) => ({ ...current, [field]: undefined })); }
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const nextErrors = validate(new FormData(event.currentTarget), category);
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault(); setErrors(nextErrors);
      event.currentTarget.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
    }
  }
  const priceCurrency = category === "Mutual Fund" || category === "Private Fund" || category === "TSD" ? "THB" : "USD";
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild><button className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-3 text-sm font-semibold text-[#10140a] transition hover:bg-[#d5ff75] sm:px-4"><Plus size={16}/><span className="hidden min-[380px]:inline">Add asset</span></button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay dialog-overlay-motion"/><Dialog.Content className="asset-dialog dialog-sheet-motion">
      <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-extrabold tracking-[-.04em]">Add an asset</Dialog.Title><Dialog.Description className="mt-1 text-xs text-muted">A snapshot is saved whenever your portfolio changes.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close"><X size={17}/></Dialog.Close></div>
      <form action={action} noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Symbol" name="symbol" error={errors.symbol} onChange={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/[^A-Za-z0-9() -]/g, "").toUpperCase(); clearError("symbol"); }} placeholder="AAPL" autoCapitalize="characters" autoCorrect="off" inputMode="text" lang="en" pattern="[A-Za-z0-9() -]+" maxLength={30} />
        <fieldset><legend className="asset-field-label">Asset class</legend><input type="hidden" name="category" value={category}/><Tabs value={category} onValueChange={setCategory} variant="segment" className="w-full"><TabsList className="grid w-full grid-cols-2 gap-2 rounded-none border-0 bg-transparent p-0 [&>div]:w-full [&>div]:rounded-xl [&>div]:border [&>div]:border-line">{categories.map((option) => <TabsTrigger key={option} value={option} className={category === option ? "h-10 w-full rounded-xl text-sm font-extrabold text-[#10140a] hover:text-[#10140a]" : "h-10 w-full rounded-xl text-sm font-bold text-muted hover:text-ink"} indicatorClassName="bg-accent">{option}</TabsTrigger>)}</TabsList></Tabs></fieldset>
        <label className="auth-field"><span>Asset group</span><AssetGroupSelect name="groupId" groups={groups} value={groupId} onValueChange={setGroupId}/></label>
        <div className="grid grid-cols-2 gap-3">
          <Field label={category === "Private Fund" ? "Units (optional)" : "Units"} name="units" type="number" error={errors.units} onChange={() => clearError("units")} placeholder="0" min="0" step="any" required={category !== "Private Fund"} />
          <Field label={`Average price (${priceCurrency})${category === "Private Fund" ? " (optional)" : ""}`} name="averagePrice" type="number" error={errors.averagePrice} onChange={() => clearError("averagePrice")} placeholder="0.00" min="0" step="any" required={category !== "Private Fund"} />
        </div>
        <Field label={`Total cost (${priceCurrency})`} name="totalCost" type="number" error={errors.totalCost} onChange={() => clearError("totalCost")} placeholder="Optional — calculated from units × average price" min="0" step="any" required={false} />
        <div className="grid grid-cols-2 gap-3">
          {category === "Stocks" || category === "TSD" ? <div className="col-span-2"><Field label={`${category === "TSD" ? "Thai" : "US"} dividend yield (%)`} name="dividendYield" type="number" error={errors.dividendYield} onChange={() => clearError("dividendYield")} placeholder="e.g. 0.44" min="0" max="100" step=".01" required={false} /></div> : <fieldset className="col-span-2"><legend className="asset-field-label">Accent color</legend><input type="hidden" name="color" value={color} autoComplete="off"/><div className="asset-color-grid" role="group" aria-label="Accent color">{colors.map((option) => <button key={option} type="button" className="asset-color" data-active={color === option} aria-label={`Use ${option} accent`} aria-pressed={color === option} onClick={() => setColor(option)} style={{ "--asset-color": option } as React.CSSProperties}>{color === option && <Check size={14}/>}</button>)}</div></fieldset>}
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
