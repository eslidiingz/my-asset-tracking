import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { LoginFooter, LoginForm } from "@/components/login-form";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect(session.user.mustChangePassword ? "/reset-password" : "/");
  return <AuthShell eyebrow="Private workspace" title="Welcome back" description="Sign in with your Ledgerly username to view your portfolio." footer={<LoginFooter/>}><LoginForm/></AuthShell>;
}
