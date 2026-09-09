"use client";

import { ArrowRightLeft, LoaderCircle, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshCurrencyRate } from "@/app/actions/settings";
import { useToast } from "@/components/ui/toast-provider";

export function CurrencyRateSettings({ initialRate }: { initialRate: number | null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function refresh() {
    setError("");
    startTransition(async () => {
      const result = await refreshCurrencyRate();
      if (!result.success) {
        setError(result.error);
        return;
      }
      showToast("Latest USD to THB rate saved.", "success");
      router.refresh();
    });
  }

  return <section className="bento-card !mt-3 !p-4 md:!mt-4"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-soft text-muted"><ArrowRightLeft size={16}/></span><div className="min-w-0"><p className="label">USD → THB</p><p className="mt-0.5 truncate text-base font-extrabold tracking-[-.03em]">1 USD = {initialRate ? initialRate.toFixed(2) : "—"} <span className="text-xs text-muted">THB</span></p></div></div><button type="button" onClick={refresh} disabled={pending} aria-label="Refresh USD to THB rate" title="Refresh rate" className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-[#10140a] disabled:opacity-50">{pending ? <LoaderCircle size={15} className="animate-spin"/> : <RefreshCw size={16}/>}</button></div><div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-2.5"><a href="https://frankfurter.dev/" target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-muted transition hover:text-ink">Reference rates by Frankfurter</a><span className="text-[10px] text-muted">Daily rate</span></div>{error && <p role="alert" className="mt-2 text-xs font-semibold text-negative">{error}</p>}</section>;
}
