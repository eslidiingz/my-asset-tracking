"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const schema = z.object({ username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.]+$/), password: z.string().min(10).max(128) });

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({ username: form.get("username"), password: form.get("password") });
    if (!parsed.success) { setError("Enter a valid username and a password of at least 10 characters."); return; }
    setLoading(true);
    const result = await authClient.signIn.username(parsed.data);
    if (result.error) { setError(result.error.status === 429 ? "Too many attempts. Please wait a minute." : "Invalid username or password."); setLoading(false); return; }
    router.push("/"); router.refresh();
  }

  return <form onSubmit={submit} className="space-y-4">
    <label className="auth-field"><span>Username</span><div><UserRound size={17}/><input name="username" autoComplete="off" autoCapitalize="none" spellCheck={false} required placeholder="your.username" /></div></label>
    <label className="auth-field"><span>Password</span><div><LockKeyhole size={17}/><input name="password" type={showPassword ? "text" : "password"} autoComplete="off" required placeholder="Your password" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
    {error && <p role="alert" className="rounded-xl border border-negative/20 bg-negative/10 px-3 py-2.5 text-xs font-semibold text-negative">{error}</p>}
    <button disabled={loading} className="auth-submit">{loading ? <LoaderCircle className="animate-spin" size={17}/> : <LockKeyhole size={17}/>} {loading ? "Signing in…" : "Sign in"}</button>
  </form>;
}

export function LoginFooter() { return <>Access is limited to accounts provisioned by your administrator.</>; }
