"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole } from "lucide-react";
import { resetInitialPassword, type PasswordState } from "@/app/reset-password/actions";

const initialState: PasswordState = { error: "" };

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetInitialPassword, initialState);
  const [showPassword, setShowPassword] = useState(false);
  return <form action={action} className="space-y-4">
    <label className="auth-field"><span>Temporary password</span><div><LockKeyhole size={17}/><input name="currentPassword" type={showPassword ? "text" : "password"} autoComplete="off" required placeholder="Current temporary password" /></div></label>
    <label className="auth-field"><span>New password</span><div><KeyRound size={17}/><input name="newPassword" type={showPassword ? "text" : "password"} autoComplete="off" minLength={12} maxLength={128} required placeholder="At least 12 characters" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide passwords" : "Show passwords"}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
    <label className="auth-field"><span>Confirm new password</span><div><KeyRound size={17}/><input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="off" minLength={12} maxLength={128} required placeholder="Repeat the new password" /></div></label>
    <p className="text-[11px] leading-relaxed text-muted">Use 12–128 characters and avoid reusing this password on another service.</p>
    {state.error && <p role="alert" className="rounded-xl border border-negative/20 bg-negative/10 px-3 py-2.5 text-xs font-semibold text-negative">{state.error}</p>}
    <button disabled={pending} className="auth-submit">{pending ? <LoaderCircle className="animate-spin" size={17}/> : <KeyRound size={17}/>} {pending ? "Updating password…" : "Set new password"}</button>
  </form>;
}
