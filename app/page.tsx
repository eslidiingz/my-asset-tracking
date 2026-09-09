import { Dashboard } from "@/components/dashboard";
import { Header } from "@/components/header";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { getAssetGroups, getAssetGroupValueTransactions, getAssets } from "@/lib/db";
import { getPortfolioGrowth } from "@/lib/portfolio";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/reset-password");
  const [assets, groups, growth, groupValueTransactions] = await Promise.all([getAssets(session.user.id), getAssetGroups(session.user.id), getPortfolioGrowth(session.user.id), getAssetGroupValueTransactions(session.user.id)]);
  return <div className="flex min-h-screen"><Sidebar pathname="/" /><div className="min-w-0 flex-1"><Header userName={session.user.name} groups={groups}/><Dashboard assets={assets} growth={growth} groups={groups} groupValueTransactions={groupValueTransactions} /></div><MobileNav pathname="/" /></div>;
}
