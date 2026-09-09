"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { currencySettings } from "@/db/schema";
import { auth } from "@/lib/auth";

export type SettingsFormState = { error: string; success: boolean };

async function saveRateForUser(userId: string, usdToThbRate: number) {
  const updatedAt = new Date();
  const existing = await db.select({ userId: currencySettings.userId }).from(currencySettings).where(eq(currencySettings.userId, userId)).limit(1);
  if (existing.length > 0) await db.update(currencySettings).set({ usdToThbRate, updatedAt }).where(eq(currencySettings.userId, userId));
  else await db.insert(currencySettings).values({ userId, usdToThbRate, updatedAt });
}

export async function refreshCurrencyRate(): Promise<SettingsFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  try {
    const response = await fetch("https://api.frankfurter.dev/v2/rate/USD/THB", { next: { revalidate: 600 }, signal: AbortSignal.timeout(10_000) });
    const payload = z.object({ rate: z.number().positive().max(1_000) }).safeParse(await response.json());
    if (!response.ok || !payload.success) return { error: "The latest USD to THB rate is unavailable right now.", success: false };
    await saveRateForUser(session.user.id, payload.data.rate);
    revalidatePath("/");
    revalidatePath("/settings");
    return { error: "", success: true };
  } catch {
    return { error: "The latest USD to THB rate is unavailable right now.", success: false };
  }
}
