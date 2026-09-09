"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Eye, EyeOff, FolderCog, GripVertical, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createAssetGroup, deleteAssetGroup, renameAssetGroup, reorderAssetGroups } from "@/app/actions/assets";
import type { AssetGroup } from "@/lib/db";
import { useToast } from "@/components/ui/toast-provider";

const pastelGroupColors = [
  { value: "#C8FF52", label: "Moss" },
  { value: "#F1BB5B", label: "Amber" },
  { value: "#5DE4C7", label: "Mint" },
  { value: "#FF7A6B", label: "Coral" },
  { value: "#9478FF", label: "Violet" },
  { value: "#8FAFC0", label: "Blue" },
  { value: "#C5BFB2", label: "Stone" },
  { value: "#FF8DC7", label: "Pink" },
  { value: "#61D8FF", label: "Cyan" },
  { value: "#B99AFF", label: "Lavender" },
  { value: "#FF9B69", label: "Tangerine" },
  { value: "#D9E85D", label: "Lime" },
  { value: "#74D99C", label: "Green" },
  { value: "#FFDC72", label: "Gold" },
];

function GroupColorSelect({ defaultValue, name, label, compact = false }: { defaultValue: string; name: string; label: string; compact?: boolean }) {
  const [value, setValue] = useState(defaultValue);
  const selected = pastelGroupColors.find((color) => color.value === value) ?? pastelGroupColors[0];

  useEffect(() => setValue(defaultValue), [defaultValue]);

  return <DropdownMenu.Root><DropdownMenu.Trigger asChild><button type="button" aria-label={label} className={`inline-flex items-center justify-between gap-2 rounded-xl border border-line bg-canvas font-bold text-ink outline-none transition hover:border-[#4b5547] focus-visible:ring-2 focus-visible:ring-ring ${compact ? "h-9 min-w-24 px-2 text-xs" : "h-11 min-w-28 px-3 text-sm"}`}><span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: selected.value }}/><span>{selected.label}</span></span><ChevronDown size={compact ? 14 : 16} className="shrink-0 text-muted"/></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} className="z-[70] min-w-40 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-[0_18px_45px_rgba(0,0,0,.5)]">{pastelGroupColors.map((color) => <DropdownMenu.Item key={color.value} onSelect={() => setValue(color.value)} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted outline-none transition data-[highlighted]:bg-soft data-[highlighted]:text-ink"><span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: color.value }}/>{color.label}</span>{value === color.value && <Check size={15} className="text-accent"/>}</DropdownMenu.Item>)}</DropdownMenu.Content></DropdownMenu.Portal><input type="hidden" name={name} value={value} autoComplete="off"/></DropdownMenu.Root>;
}

function GroupVisibilityToggle({ defaultValue, name, label }: { defaultValue: boolean; name: string; label: string }) {
  const [visible, setVisible] = useState(defaultValue);
  useEffect(() => setVisible(defaultValue), [defaultValue]);
  return <div className="flex items-center gap-2"><input type="hidden" name={name} value={String(visible)} autoComplete="off"/><button type="button" role="switch" aria-checked={visible} aria-label={label} onClick={() => setVisible((current) => !current)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${visible ? "bg-accent" : "bg-soft"}`}><span className={`grid size-5 place-items-center rounded-full bg-canvas shadow-sm transition-transform ${visible ? "translate-x-5" : "translate-x-0.5"}`}>{visible ? <Eye size={12} className="text-[#10140a]"/> : <EyeOff size={12} className="text-muted"/>}</span></button><span className="text-[11px] font-bold text-muted">{visible ? "Shown" : "Hidden"}</span></div>;
}

export function AssetGroupManager({ groups }: { groups: AssetGroup[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [groupToDelete, setGroupToDelete] = useState<AssetGroup | null>(null);
  const [orderedGroups, setOrderedGroups] = useState(groups);
  const [draggedGroupId, setDraggedGroupId] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => setOrderedGroups(groups), [groups]);
  function run(action: (formData: FormData) => Promise<{ error: string; success: boolean }>, formData: FormData, successMessage?: string) {
    setError("");
    startTransition(async () => {
      const result = await action(formData);
      if (result.success) {
        if (successMessage) showToast(successMessage, "success");
        router.refresh();
      } else {
        setError(result.error);
        if (successMessage) showToast(result.error, "error");
      }
    });
  }

  function moveGroup(draggedId: number, targetId: number) {
    if (draggedId === targetId || pending) return;
    const nextGroups = [...orderedGroups];
    const fromIndex = nextGroups.findIndex((group) => group.id === draggedId);
    const targetIndex = nextGroups.findIndex((group) => group.id === targetId);
    if (fromIndex < 0 || targetIndex < 0) return;
    const [draggedGroup] = nextGroups.splice(fromIndex, 1);
    nextGroups.splice(targetIndex, 0, draggedGroup);
    setOrderedGroups(nextGroups);
    const formData = new FormData();
    formData.set("groupIds", JSON.stringify(nextGroups.map((group) => group.id)));
    run(reorderAssetGroups, formData, "Group order saved.");
  }

  const draggedGroup = orderedGroups.find((group) => group.id === draggedGroupId);

  return <>
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild><button className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-bold text-muted transition hover:bg-soft hover:text-ink"><FolderCog size={15}/> Manage groups</button></Dialog.Trigger>
      <Dialog.Portal><Dialog.Overlay className="dialog-overlay dialog-overlay-motion"/><Dialog.Content className="asset-dialog dialog-sheet-motion max-w-md">
        <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-extrabold tracking-[-.04em]">Asset groups</Dialog.Title><Dialog.Description className="mt-1 text-xs leading-5 text-muted">Manage names, colors, order, and whether a group appears in the asset-list badges. Hidden groups remain available in valuation history.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close"><X size={17}/></Dialog.Close></div>
        <form action={(formData) => run(createAssetGroup, formData, "Group created.")} className="mt-6 flex gap-2"><input type="hidden" name="visibleInAssetList" value="true"/><input name="name" autoComplete="off" required maxLength={40} placeholder="New group name" className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 text-sm outline-none focus:border-accent"/><GroupColorSelect defaultValue="#C8FF52" name="color" label="New group badge color"/><button disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-3 text-sm font-extrabold text-[#10140a] disabled:opacity-50"><Plus size={16}/>Add</button></form>
        {error && <p role="alert" className="mt-3 text-xs font-semibold text-negative">{error}</p>}
        <div className="mt-5 space-y-2">{orderedGroups.map((group) => <form key={group.id} action={(formData) => run(renameAssetGroup, formData, "Group updated.")} onDragStart={(event) => { setDraggedGroupId(group.id); setDragPosition({ x: event.clientX, y: event.clientY }); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(group.id)); }} onDrag={(event) => { if (event.clientX || event.clientY) setDragPosition({ x: event.clientX, y: event.clientY }); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = Number(event.dataTransfer.getData("text/plain")) || draggedGroupId; if (id) moveGroup(id, group.id); setDraggedGroupId(null); setDragPosition(null); }} onDragEnd={() => { setDraggedGroupId(null); setDragPosition(null); }} className={`rounded-xl border border-line bg-canvas p-3 transition ${draggedGroupId === group.id ? "opacity-40" : ""}`}><div className="flex items-center gap-2"><button type="button" draggable={!pending} disabled={pending} className="grid size-9 shrink-0 cursor-grab place-items-center rounded-lg text-muted hover:bg-soft active:cursor-grabbing" aria-label={`Drag ${group.name} to reorder`} title="Drag to reorder"><GripVertical size={17}/></button><input type="hidden" name="id" value={group.id} autoComplete="off"/><span className="size-3 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: group.color }} aria-hidden/><input name="name" autoComplete="off" required maxLength={40} defaultValue={group.name} className="h-9 min-w-0 flex-1 bg-transparent px-1 text-sm font-semibold outline-none"/><GroupColorSelect defaultValue={group.color} name="color" label={`${group.name} badge color`} compact/><button type="button" disabled={pending} onClick={() => setGroupToDelete(group)} className="grid size-9 place-items-center rounded-lg text-negative transition hover:bg-negative/10" aria-label={`Delete ${group.name}`}><Trash2 size={16}/></button></div><div className="mt-3 flex items-center justify-between border-t border-line pt-3"><GroupVisibilityToggle defaultValue={group.visibleInAssetList} name="visibleInAssetList" label={`Show ${group.name} on the asset list`}/><button disabled={pending} className="rounded-lg bg-soft px-3 py-2 text-xs font-bold text-muted hover:text-ink">Save changes</button></div></form>)}</div>
        {pending && <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted"><LoaderCircle size={15} className="animate-spin"/>Updating groups…</div>}
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
    {draggedGroup && dragPosition && <div aria-hidden className="pointer-events-none fixed z-[100] flex w-72 items-center gap-2 rounded-xl border border-accent/70 bg-canvas/95 p-2 shadow-2xl backdrop-blur-sm" style={{ left: dragPosition.x, top: dragPosition.y, transform: "translate(-50%, -50%)" }}><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-soft text-muted"><GripVertical size={17}/></span><span className="min-w-0 flex-1 truncate px-2 text-sm font-semibold text-ink">{draggedGroup.name}</span><span className="rounded-lg bg-soft px-2.5 py-2 text-xs font-bold text-muted">Moving</span></div>}
    {groupToDelete && <Dialog.Root open onOpenChange={(nextOpen) => { if (!nextOpen) setGroupToDelete(null); }}><Dialog.Portal><Dialog.Overlay className="dialog-overlay dialog-overlay-motion z-[60]"/><Dialog.Content className="asset-dialog dialog-sheet-motion z-[61] max-w-sm"><Dialog.Title className="text-xl font-extrabold tracking-[-.04em]">Delete {groupToDelete.name}?</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-muted">Assets in this group will have no group after deletion.</Dialog.Description><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Dialog.Close className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:bg-soft">Cancel</Dialog.Close><button disabled={pending} onClick={() => { const formData = new FormData(); formData.set("id", String(groupToDelete.id)); run(deleteAssetGroup, formData, `${groupToDelete.name} group deleted.`); setGroupToDelete(null); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-negative px-4 text-sm font-semibold text-white hover:bg-[#ff9488] disabled:opacity-50"><Trash2 size={16}/>Delete group</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>}
  </>;
}
