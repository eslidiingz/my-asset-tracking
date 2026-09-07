"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, LoaderCircle, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveAssetsToGroup } from "@/app/actions/assets";
import { AssetMark } from "@/components/asset-mark";
import type { Asset, AssetGroup } from "@/lib/db";

const stockColor = "#c8ff52";

export function SelectAssetsToGroupDialog({
  assets,
  groups,
  group,
  open,
  onOpenChange,
}: {
  assets: Asset[];
  groups: AssetGroup[];
  group: AssetGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const stocks = assets.filter((asset) => asset.category === "Stocks" && asset.groupId !== group.id);
  const allSelected = stocks.length > 0 && selectedIds.size === stocks.length;
  const groupName = (id: number | null) => groups.find((assetGroup) => assetGroup.id === id)?.name ?? "No group";

  function toggleAsset(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(stocks.map((asset) => asset.id)));
  }

  function moveSelected() {
    const formData = new FormData();
    selectedIds.forEach((id) => formData.append("assetIds", String(id)));
    formData.set("groupId", String(group.id));
    setError("");

    startTransition(async () => {
      const result = await moveAssetsToGroup(formData);
      if (result.success) {
        setSelectedIds(new Set());
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay dialog-overlay-motion" />
      <Dialog.Content className="asset-dialog asset-picker-dialog dialog-sheet-motion">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <Dialog.Title className="text-2xl font-extrabold tracking-[-.04em]">Select assets</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted">Choose stocks to add to {group.name}.</Dialog.Description>
          </div>
          <Dialog.Close disabled={pending} className="icon-button" aria-label="Close"><X size={17} /></Dialog.Close>
        </div>

        {stocks.length === 0 ? <div className="grid flex-1 place-items-center text-center"><div><p className="text-sm font-bold">No stocks available</p><p className="mt-1 text-xs text-muted">Add a stock first, then assign it to this group.</p></div></div> : <>
          <div className="flex shrink-0 items-center justify-between gap-3 py-4">
            <p className="text-sm font-bold">{stocks.length} available stocks</p>
            <button type="button" onClick={toggleAll} className="inline-flex items-center gap-2 rounded-full border border-line bg-soft/60 px-3 py-2 text-xs font-bold transition hover:bg-soft">
              <span className="grid size-4 place-items-center rounded border border-line bg-canvas text-[#10140a]">{allSelected && <Check size={12} className="text-accent" />}</span>
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {stocks.map((asset) => <button key={asset.id} type="button" onClick={() => toggleAsset(asset.id)} aria-pressed={selectedIds.has(asset.id)} className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-canvas px-3 py-3 text-left transition hover:bg-soft aria-pressed:border-accent aria-pressed:bg-soft">
                <span className="grid size-5 shrink-0 place-items-center rounded border border-line bg-surface text-[#10140a]">{selectedIds.has(asset.id) && <Check size={14} className="text-accent" />}</span>
                <AssetMark category={asset.category} color={stockColor} />
                <span className="min-w-0"><span className="flex flex-wrap items-center gap-1.5"><span className="text-sm font-bold">{asset.symbol}</span>{asset.groupId !== null && <span className="category-pill !px-1.5 !py-0 !text-[9px]">{groupName(asset.groupId)}</span>}</span><span className="mt-0.5 block text-xs text-muted">{asset.units} units</span></span>
              </button>)}
            </div>
          </div>
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>{error && <p role="alert" className="text-xs font-semibold text-negative">{error}</p>}</div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Dialog.Close disabled={pending} className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-semibold transition hover:bg-soft disabled:pointer-events-none disabled:opacity-50">Cancel</Dialog.Close>
              <button type="button" disabled={selectedIds.size === 0 || pending} onClick={moveSelected} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-extrabold text-[#10140a] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-50">{pending && <LoaderCircle size={16} className="animate-spin" />}{pending ? "Adding…" : `Add ${selectedIds.size} ${selectedIds.size === 1 ? "asset" : "assets"}`}</button>
            </div>
          </div>
        </>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
