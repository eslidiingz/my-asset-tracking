"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { FolderCog, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAssetGroup, deleteAssetGroup, renameAssetGroup } from "@/app/actions/assets";
import type { AssetGroup } from "@/lib/db";

export function AssetGroupManager({ groups }: { groups: AssetGroup[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [groupToDelete, setGroupToDelete] = useState<AssetGroup | null>(null);

  function run(action: (formData: FormData) => Promise<{ error: string; success: boolean }>, formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await action(formData);
      if (result.success) router.refresh();
      else setError(result.error);
    });
  }

  return <><Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><button className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-bold text-muted transition hover:bg-soft hover:text-ink"><FolderCog size={15}/> Manage groups</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="dialog-overlay dialog-overlay-motion"/><Dialog.Content className="asset-dialog dialog-sheet-motion max-w-md"><div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-extrabold tracking-[-.04em]">Asset groups</Dialog.Title><Dialog.Description className="mt-1 text-xs text-muted">Assets may have no group. Deleting a group clears its assignments.</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close"><X size={17}/></Dialog.Close></div><form action={(formData) => run(createAssetGroup, formData)} className="mt-6 flex gap-2"><input name="name" autoComplete="off" required maxLength={40} placeholder="New group name" className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 text-sm outline-none focus:border-accent"/><button disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-3 text-sm font-extrabold text-[#10140a] disabled:opacity-50"><Plus size={16}/>Add</button></form>{error && <p role="alert" className="mt-3 text-xs font-semibold text-negative">{error}</p>}<div className="mt-5 space-y-2">{groups.map((group) => <form key={group.id} action={(formData) => run(renameAssetGroup, formData)} className="flex items-center gap-2 rounded-xl border border-line bg-canvas p-2"><input type="hidden" name="id" value={group.id} autoComplete="off"/><input name="name" autoComplete="off" required maxLength={40} defaultValue={group.name} className="h-9 min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold outline-none"/><button disabled={pending} className="rounded-lg bg-soft px-2.5 py-2 text-xs font-bold text-muted hover:text-ink">Save</button><button type="button" disabled={pending} onClick={() => setGroupToDelete(group)} className="grid size-9 place-items-center rounded-lg text-negative transition hover:bg-negative/10" aria-label={`Delete ${group.name}`}><Trash2 size={16}/></button></form>)}</div>{pending && <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted"><LoaderCircle size={15} className="animate-spin"/>Updating groups…</div>}</Dialog.Content></Dialog.Portal></Dialog.Root>{groupToDelete && <Dialog.Root open onOpenChange={(nextOpen) => { if (!nextOpen) setGroupToDelete(null); }}><Dialog.Portal><Dialog.Overlay className="dialog-overlay dialog-overlay-motion z-[60]"/><Dialog.Content className="asset-dialog dialog-sheet-motion z-[61] max-w-sm"><Dialog.Title className="text-xl font-extrabold tracking-[-.04em]">Delete {groupToDelete.name}?</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-muted">Assets in this group will have no group after deletion.</Dialog.Description><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Dialog.Close className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:bg-soft">Cancel</Dialog.Close><button disabled={pending} onClick={() => { const formData = new FormData(); formData.set("id", String(groupToDelete.id)); run(deleteAssetGroup, formData); setGroupToDelete(null); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-negative px-4 text-sm font-semibold text-white hover:bg-[#ff9488] disabled:opacity-50"><Trash2 size={16}/>Delete group</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>}</>;
}
