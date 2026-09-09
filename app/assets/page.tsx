import { Header } from "@/components/header";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { AssetList } from "@/components/asset-list";
import { UpdateGroupValueDialog } from "@/components/update-group-value-dialog";
import { auth } from "@/lib/auth";
import { getAssets } from "@/lib/db";
import { getAssetGroups } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/reset-password");
  const [assets, groups] = await Promise.all([getAssets(session.user.id), getAssetGroups(session.user.id)]);
  return <div className="flex min-h-screen"><Sidebar pathname="/assets"/><div className="min-w-0 flex-1"><Header userName={session.user.name} groups={groups}/><main className="mx-auto w-full max-w-6xl px-4 py-7 pb-28 sm:px-6 md:px-8"><div><p className="eyebrow">Assets</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.055em]">Your holdings</h1><p className="mt-2 text-sm text-muted">See every position in your portfolio, including average price and dividend yield.</p></div><AssetList assets={assets} groups={groups}/><section className="bento-card !mt-3 flex flex-wrap items-center justify-between gap-4 md:!mt-4"><div><p className="label">Group value updates</p><h2 className="mt-1 text-lg font-extrabold tracking-[-.03em]">Record a group valuation</h2><p className="mt-1 text-xs leading-5 text-muted">Save a total value, including profit or loss, for your group history chart.</p></div><UpdateGroupValueDialog groups={groups}/></section></main></div><MobileNav pathname="/assets"/></div>;
}
