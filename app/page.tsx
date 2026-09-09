import { Dashboard } from "@/components/dashboard";
import { Header } from "@/components/header";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { getAssetGroups, getAssetGroupValueTransactions, getAssets, getCurrencySettings, getDividendTransactions } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/reset-password");
  const [assets, groups, groupValueTransactions, dividendTransactions, currencySettings] = await Promise.all([getAssets(session.user.id), getAssetGroups(session.user.id), getAssetGroupValueTransactions(session.user.id), getDividendTransactions(session.user.id), getCurrencySettings(session.user.id)]);
  return <div className="flex min-h-screen"><Sidebar pathname="/" /><div className="min-w-0 flex-1"><Header userName={session.user.name} groups={groups}/><Dashboard assets={assets} groups={groups} groupValueTransactions={groupValueTransactions} dividendTransactions={dividendTransactions} usdToThbRate={currencySettings?.usdToThbRate ?? null} /></div><MobileNav pathname="/" /></div>;
}
