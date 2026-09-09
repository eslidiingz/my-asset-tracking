import { AssetGroupManager } from "@/components/asset-group-manager";
import { CurrencyRateSettings } from "@/components/currency-rate-settings";
import { Header } from "@/components/header";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { auth } from "@/lib/auth";
import { getAssetGroups, getCurrencySettings } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/reset-password");
  const [groups, currencySettings] = await Promise.all([getAssetGroups(session.user.id), getCurrencySettings(session.user.id)]);

  return <div className="flex min-h-screen"><Sidebar pathname="/settings"/><div className="min-w-0 flex-1"><Header userName={session.user.name} groups={groups}/><main className="mx-auto w-full max-w-4xl px-4 py-7 pb-28 sm:px-6 md:px-8"><p className="eyebrow">Settings</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.055em]">Portfolio settings</h1><p className="mt-2 text-sm text-muted">Configure how your portfolio is organized.</p><CurrencyRateSettings initialRate={currencySettings?.usdToThbRate ?? null}/><section className="bento-card mt-3 flex flex-wrap items-center justify-between gap-4 md:mt-4"><div><h2 className="text-lg font-extrabold tracking-[-.03em]">Asset groups</h2><p className="mt-1 max-w-lg text-sm text-muted">Create groups for your holdings. Assets can also have no group.</p></div><AssetGroupManager groups={groups}/></section></main></div><MobileNav pathname="/settings"/></div>;
}
