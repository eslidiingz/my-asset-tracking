import { cn } from "@/lib/utils";

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return <div className={cn("grid size-9 place-items-center rounded-full bg-moss text-xs font-bold text-white", className)}>{initials}</div>;
}
