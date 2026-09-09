"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ToastTone = "success" | "error";
type ToastContextValue = { showToast: (message: string, tone: ToastTone) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const showToast = useCallback((message: string, tone: ToastTone) => setToast({ message, tone }), []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return <ToastContext.Provider value={{ showToast }}>{children}{toast && typeof document !== "undefined" && createPortal(<div className="fixed left-1/2 top-5 z-[200] w-max max-w-[calc(100vw-2.5rem)] -translate-x-1/2"><div role={toast.tone === "error" ? "alert" : "status"} className={`toast-motion flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold shadow-2xl ${toast.tone === "success" ? "border-positive/35 bg-[#10261c] text-positive" : "border-negative/35 bg-[#2a1613] text-negative"}`}>{toast.tone === "success" ? <CircleCheck size={18}/> : <CircleAlert size={18}/>}<span>{toast.message}</span><button type="button" onClick={() => setToast(null)} className="ml-2 text-xs font-extrabold opacity-70 transition hover:opacity-100" aria-label="Dismiss notification">Dismiss</button></div></div>, document.body)}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
