import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

export function AuthShell({ eyebrow, title, description, children, footer }: { eyebrow: string; title: string; description: string; children: ReactNode; footer: ReactNode }) {
  return <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
    <div className="auth-glow" aria-hidden />
    <section className="relative z-10 w-full max-w-[430px] rounded-[28px] border border-line bg-surface/95 p-6 shadow-[0_32px_90px_rgba(0,0,0,.45)] backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-accent text-sm font-extrabold text-[#11150d]">L</span><span className="text-lg font-extrabold tracking-[-.04em]">ledgerly</span></div>
      <div className="mt-9"><p className="eyebrow">{eyebrow}</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.055em]">{title}</h1><p className="mt-2 text-sm leading-relaxed text-muted">{description}</p></div>
      <div className="mt-7">{children}</div>
      <div className="mt-6 border-t border-line pt-5 text-center text-xs text-muted">{footer}</div>
      <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-muted"><ShieldCheck size={13} className="text-positive"/> Secured with encrypted transport</div>
    </section>
  </main>;
}
