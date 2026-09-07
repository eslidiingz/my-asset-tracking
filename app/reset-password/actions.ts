"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

export type PasswordState = { error: string };

const passwordSchema = z.object({
  currentPassword: z.string().min(10).max(128),
  newPassword: z.string().min(12).max(128),
  confirmPassword: z.string().min(12).max(128),
}).refine((value) => value.newPassword === value.confirmPassword, { message: "The new passwords do not match." })
  .refine((value) => value.currentPassword !== value.newPassword, { message: "Choose a password different from the temporary password." });

export async function resetInitialPassword(_state: PasswordState, formData: FormData): Promise<PasswordState> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) redirect("/login");
  if (!session.user.mustChangePassword) redirect("/");

  const parsed = passwordSchema.safeParse({ currentPassword: formData.get("currentPassword"), newPassword: formData.get("newPassword"), confirmPassword: formData.get("confirmPassword") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid new password." };

  try {
    await auth.api.changePassword({ body: { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword, revokeOtherSessions: true }, headers: requestHeaders });
    await db.update(users).set({ mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, session.user.id));
  } catch {
    return { error: "The temporary password is incorrect or the password could not be changed." };
  }
  redirect("/");
}
