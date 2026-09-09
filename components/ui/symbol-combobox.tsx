"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export function SymbolCombobox({ symbols }: { symbols: string[] }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => value ? symbols.filter((symbol) => symbol.startsWith(value)).slice(0, 6) : [], [symbols, value]);

  function chooseSymbol(symbol: string) {
    setValue(symbol);
    setOpen(false);
  }

  return <div className="relative min-w-0 flex-1">
    <input name="symbol" value={value} required placeholder="Start typing a symbol" autoComplete="off" autoCapitalize="characters" autoCorrect="off" role="combobox" aria-autocomplete="list" aria-expanded={open && matches.length > 0} aria-controls="symbol-suggestions" onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onChange={(event) => { const nextValue = event.currentTarget.value.replace(/[^A-Za-z0-9() -]/g, "").toUpperCase(); setValue(nextValue); setOpen(true); }} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); if (event.key === "Enter" && matches.length > 0) { event.preventDefault(); chooseSymbol(matches[0]); } }} />
    {open && matches.length > 0 && <div id="symbol-suggestions" role="listbox" className="absolute left-0 top-[calc(100%+.65rem)] z-50 w-full overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-[0_18px_45px_rgba(0,0,0,.5)]">{matches.map((symbol) => <button key={symbol} type="button" role="option" aria-selected={symbol === value} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseSymbol(symbol)} className={cn("!flex !w-full !items-center !justify-start rounded-lg px-3 py-2.5 !text-left text-sm font-bold transition hover:bg-soft hover:text-ink", symbol === value ? "bg-soft text-ink" : "text-muted")}>{symbol}</button>)}</div>}
  </div>;
}
