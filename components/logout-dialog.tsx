"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function LogoutDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setPending(true);
    setError("");

    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setError("We couldn't sign you out. Please try again.");
      setPending(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-label="Sign out"
          title="Sign out"
          className="grid size-10 place-items-center rounded-full border border-line bg-surface text-muted transition hover:border-negative/50 hover:text-negative"
        >
          <LogOut size={17} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay dialog-overlay-motion" />
        <Dialog.Content className="asset-dialog dialog-sheet-motion max-w-sm">
          <Dialog.Title className="text-xl font-extrabold tracking-[-.04em]">Sign out?</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-muted">
            You’ll need to sign in again to access your portfolio.
          </Dialog.Description>
          {error && <p role="alert" className="mt-4 rounded-xl border border-negative/20 bg-negative/10 px-3 py-2.5 text-xs font-semibold text-negative">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close disabled={pending} className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-semibold transition hover:bg-soft disabled:pointer-events-none disabled:opacity-50">
              Cancel
            </Dialog.Close>
            <button type="button" onClick={signOut} disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-negative px-4 text-sm font-semibold text-white transition hover:bg-[#ff9488] disabled:pointer-events-none disabled:opacity-50">
              {pending ? <LoaderCircle size={16} className="animate-spin" /> : <LogOut size={16} />}
              {pending ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
