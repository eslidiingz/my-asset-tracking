"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import type { AssetGroup } from "@/lib/db";
import { cn } from "@/lib/utils";

export function AssetGroupSelect({ groups, value, onValueChange, name, className, allowNoGroup = true }: { groups: AssetGroup[]; value: string; onValueChange: (value: string) => void; name?: string; className?: string; allowNoGroup?: boolean }) {
  const selected = groups.find((group) => String(group.id) === value)?.name ?? (allowNoGroup ? "No group" : "Select a group");
  const options = [...(allowNoGroup ? [{ id: "", name: "No group" }] : []), ...groups.map((group) => ({ id: String(group.id), name: group.name }))];

  return <DropdownMenu.Root><DropdownMenu.Trigger asChild><button type="button" className={cn("flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-3 text-left text-sm font-semibold text-ink outline-none transition hover:border-[#4b5547] focus-visible:ring-2 focus-visible:ring-ring", className)}>{selected}<ChevronDown size={16} className="text-muted"/></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="start" sideOffset={8} className="z-[70] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-[0_18px_45px_rgba(0,0,0,.5)]">{options.map((option) => <DropdownMenu.Item key={option.id || "no-group"} onSelect={() => onValueChange(option.id)} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted outline-none transition data-[highlighted]:bg-soft data-[highlighted]:text-ink">{option.name}{value === option.id && <Check size={15} className="text-accent"/>}</DropdownMenu.Item>)}</DropdownMenu.Content></DropdownMenu.Portal>{name && <input type="hidden" name={name} value={value} autoComplete="off"/>}</DropdownMenu.Root>;
}
