import { AddDividendDialog } from "@/components/add-dividend-dialog";
import { DividendTransactions } from "@/components/dividend-transactions";
import { Header } from "@/components/header";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { auth } from "@/lib/auth";
import { getAssetGroups, getAssets, getDividendTransactions } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DividendsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/reset-password");

  const [assets, groups, transactions] = await Promise.all([getAssets(session.user.id), getAssetGroups(session.user.id), getDividendTransactions(session.user.id)]);
  const symbols = [...new Set(assets.filter((asset) => asset.category === "Stocks" && asset.userId === session.user.id).map((asset) => asset.symbol))];

  return <div className="flex min-h-screen"><Sidebar pathname="/dividends"/><div className="min-w-0 flex-1"><Header userName={session.user.name} groups={groups}/><main className="mx-auto w-full max-w-6xl px-4 py-7 pb-28 sm:px-6 md:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Dividends</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.055em]">Dividend income</h1><p className="mt-2 text-sm text-muted">Record payments and review your full dividend history.</p></div><AddDividendDialog symbols={symbols}/></div><DividendTransactions transactions={transactions.map((item) => ({ ...item, receivedAt: item.receivedAt.toISOString() }))}/></main></div><MobileNav pathname="/dividends"/></div>;
}
