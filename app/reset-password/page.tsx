import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { auth } from "@/lib/auth";

export default async function ResetPasswordPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (!session.user.mustChangePassword) redirect("/");
  return <AuthShell eyebrow="Security required" title="Create a new password" description="This is your first sign-in. Replace the temporary password before continuing to your portfolio." footer={<>This one-time step protects your private financial data.</>}><ResetPasswordForm/></AuthShell>;
}
