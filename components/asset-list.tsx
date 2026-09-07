"use client";

import { useState } from "react";
import { AssetMark } from "@/components/asset-mark";
import { EditAssetDialog } from "@/components/edit-asset-dialog";
import { SelectAssetsToGroupDialog } from "@/components/select-assets-to-group-dialog";
import type { Asset, AssetGroup } from "@/lib/db";
import { cn, formatCurrency } from "@/lib/utils";

const colors: Record<string, string> = {
  Stocks: "#c8ff52",
  Property: "#9478ff",
  Cash: "#5de4c7",
  Crypto: "#f1bb5b",
};
const pageSizes = [10, 20, 50];

export function AssetList({ assets, groups }: { assets: Asset[]; groups: AssetGroup[] }) {
  const [filter, setFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectingGroup, setSelectingGroup] = useState<AssetGroup | null>(null);

  const filteredAssets = filter === "all" ? assets : assets.filter((asset) => String(asset.groupId) === filter);
  const pageCount = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const visibleAssets = filteredAssets.slice(start, start + pageSize);
  const activeGroup = groups.find((group) => String(group.id) === filter) ?? null;
  const groupName = (id: number | null) => groups.find((group) => group.id === id)?.name ?? "No group";
  const filters = [{ id: "all", label: "All" }, ...groups.map((group) => ({ id: String(group.id), label: group.name }))];

  function chooseFilter(id: string) {
    setFilter(id);
    setPage(1);
  }

  function choosePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return <>
    <section className="bento-card !mt-7 overflow-hidden !p-0">
      <div className="flex items-center justify-between border-b border-line px-5 py-5 md:px-6">
        <div>
          <h2 className="text-lg font-extrabold tracking-[-.03em]">Asset list</h2>
          <p className="mt-0.5 text-xs text-muted">{filter === "all" ? `${assets.length} holdings in your portfolio` : `${filteredAssets.length} holdings in this group`}</p>
        </div>
        {activeGroup && <button type="button" onClick={() => setSelectingGroup(activeGroup)} className="rounded-full border border-line bg-surface px-3 py-2 text-xs font-bold text-muted transition hover:bg-soft hover:text-ink">Edit assets</button>}
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-line px-5 py-3 md:px-6" aria-label="Filter by group">
        {filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => chooseFilter(item.id)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition", filter === item.id ? "bg-accent text-[#10140a]" : "bg-soft text-muted hover:text-ink")}>{item.label}</button>)}
      </div>

      {filteredAssets.length === 0 ? <div className="px-5 py-10 text-center md:px-6">
        <p className="text-sm font-bold">No assets in this group</p>
        <p className="mt-1 text-xs text-muted">Choose stocks to add them to this group.</p>
        {activeGroup && <button type="button" onClick={() => setSelectingGroup(activeGroup)} className="mt-5 rounded-full bg-accent px-4 py-2.5 text-xs font-extrabold text-[#10140a] transition hover:brightness-105">Select assets</button>}
      </div> : <>
        <table className="holdings-table w-full text-left">
          <thead><tr><th>Asset</th><th>Group</th><th>Category</th><th className="text-right">Average price</th><th className="text-right">Dividend yield</th><th className="text-right">Cost basis</th></tr></thead>
          <tbody>{visibleAssets.map((asset) => <tr key={asset.id} tabIndex={0} role="button" onClick={() => setEditingAsset(asset)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setEditingAsset(asset); } }}>
            <td><div className="flex items-center gap-3"><AssetMark category={asset.category} color={colors[asset.category] ?? asset.color}/><div><p className="text-sm font-bold">{asset.symbol}</p><p className="text-[11px] text-muted">{asset.units} units</p></div></div></td>
            <td data-secondary><span className="category-pill">{groupName(asset.groupId)}</span></td>
            <td data-secondary><span className="category-pill">{asset.category}</span></td>
            <td data-secondary className="text-right text-sm font-semibold">{formatCurrency(asset.averagePrice)}</td>
            <td data-secondary className="text-right text-sm font-bold text-accent">{asset.category === "Stocks" && asset.dividendYield !== null ? `${asset.dividendYield.toFixed(2)}%` : "—"}</td>
            <td className="text-right text-sm font-extrabold">{formatCurrency(asset.units * asset.averagePrice)}</td>
          </tr>)}</tbody>
        </table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 md:px-6">
          <p className="text-xs font-semibold text-muted">Showing {start + 1}–{Math.min(start + pageSize, filteredAssets.length)} of {filteredAssets.length}</p>
          <div className="flex items-center gap-1.5">
            {pageSizes.map((size) => <button key={size} type="button" aria-pressed={pageSize === size} onClick={() => choosePageSize(size)} className={cn("rounded-lg px-2.5 py-1.5 text-xs font-bold", pageSize === size ? "bg-accent text-[#10140a]" : "bg-soft text-muted")}>{size}</button>)}
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg bg-soft px-2.5 py-1.5 text-xs font-bold text-muted disabled:opacity-40">Previous</button>
            <span className="px-1 text-xs font-bold text-muted">{currentPage} / {pageCount}</span>
            <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => value + 1)} className="rounded-lg bg-soft px-2.5 py-1.5 text-xs font-bold text-muted disabled:opacity-40">Next</button>
          </div>
        </div>
      </>}
    </section>
    {editingAsset && <EditAssetDialog asset={editingAsset} groups={groups} open onOpenChange={(nextOpen) => { if (!nextOpen) setEditingAsset(null); }} />}
    {selectingGroup && <SelectAssetsToGroupDialog assets={assets} groups={groups} group={selectingGroup} open onOpenChange={(nextOpen) => { if (!nextOpen) setSelectingGroup(null); }} />}
  </>;
}
