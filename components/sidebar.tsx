"use client";

import { HandCoins, LayoutDashboard, Settings, WalletCards, PanelLeftClose } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

const links = [
  { label: "Overview", icon: LayoutDashboard, href: "/" },
  { label: "Assets", icon: WalletCards, href: "/assets" },
  { label: "Dividends", icon: HandCoins, href: "/dividends" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

function isActivePath(href: string | undefined, pathname: string) {
  return href === "/" ? pathname === "/" : Boolean(href && (pathname === href || pathname.startsWith(`${href}/`)));
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function Sidebar({ pathname }: { pathname: string }) {
  const mounted = useMounted();
  if (!mounted) return null;

  return <aside className="hidden h-screen w-[232px] shrink-0 border-r border-line bg-surface px-4 py-5 lg:flex lg:flex-col">
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-xl bg-accent text-sm font-extrabold text-[#11150d]">L</span><span className="text-[17px] font-extrabold tracking-[-.04em]">ledgerly</span></div>
      <button aria-label="Collapse navigation" className="text-muted hover:text-ink"><PanelLeftClose size={18} /></button>
    </div>
    <nav className="mt-10 space-y-1">
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-muted">Workspace</p>
      {links.map(({ label, icon: Icon, href }) => {
        const isActive = isActivePath(href, pathname);

        return href ? <Link key={label} href={href} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition", isActive ? "bg-soft text-ink" : "text-muted hover:bg-soft/70 hover:text-ink")}><Icon size={17} strokeWidth={1.8} />{label}</Link> : <button key={label} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-soft/70 hover:text-ink"><Icon size={17} strokeWidth={1.8} />{label}</button>;
      })}
    </nav>
    <div className="mt-auto">
      <div className="flex items-center gap-3 border-t border-line px-2 pt-5"><Avatar initials="NK" /><div className="min-w-0"><p className="truncate text-sm font-bold">Nick K.</p><p className="truncate text-xs text-muted">Personal workspace</p></div></div>
    </div>
  </aside>;
}

export function MobileNav({ pathname }: { pathname: string }) {
  const mounted = useMounted();
  if (!mounted) return null;

  return <nav aria-label="Primary navigation" className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-[20px] border border-line bg-[#10130f]/95 p-1.5 shadow-[0_16px_50px_rgba(0,0,0,.45)] backdrop-blur-xl lg:hidden">{links.map(({ label, icon: Icon, href }) => {
    const isActive = isActivePath(href, pathname);

    return href ? <Link key={label} href={href} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[9px] font-bold transition", isActive ? "bg-accent text-[#10140a]" : "text-muted hover:bg-soft hover:text-ink")}><Icon size={17} strokeWidth={2}/><span>{label}</span></Link> : <button key={label} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[9px] font-bold text-muted hover:bg-soft hover:text-ink"><Icon size={17} strokeWidth={2}/><span>{label}</span></button>;
  })}</nav>;
}
