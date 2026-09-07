"use client";

import { Bell, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddAssetDialog } from "@/components/add-asset-dialog";
import { LogoutDialog } from "@/components/logout-dialog";
import type { AssetGroup } from "@/lib/db";

export function Header({ userName, groups = [] }: { userName: string; groups?: AssetGroup[] }) {
  return <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-line bg-canvas/88 px-4 backdrop-blur-xl sm:px-6 md:px-8">
    <div className="flex items-center gap-2.5 lg:hidden"><span className="grid size-8 place-items-center rounded-xl bg-accent text-sm font-extrabold text-[#11150d]">L</span><span className="hidden text-[16px] font-extrabold tracking-[-.04em] min-[360px]:inline">ledgerly</span></div>
    <div className="relative hidden sm:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} /><input aria-label="Search assets" autoComplete="off" placeholder="Search assets" className="h-10 w-56 rounded-full border border-line bg-surface pl-9 pr-4 text-sm outline-none placeholder:text-muted focus:border-moss md:w-72" /></div>
    <div className="ml-auto flex items-center gap-2"><span className="hidden text-xs font-bold text-muted xl:inline">{userName}</span><button aria-label="Notifications" className="relative grid size-10 place-items-center rounded-full border border-line bg-surface hover:bg-soft"><Bell size={17} /><span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-accent" /></button><AddAssetDialog groups={groups}/><Button variant="outline" className="hidden sm:inline-flex">USD <ChevronDown size={14} /></Button><LogoutDialog /></div>
  </header>;
}
