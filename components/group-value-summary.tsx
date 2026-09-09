import { Layers3 } from "lucide-react";
import type { AssetGroup, AssetGroupValueTransaction } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export function GroupValueSummary({ groups, transactions }: { groups: AssetGroup[]; transactions: AssetGroupValueTransaction[] }) {
  const latestByGroup = new Map<number, AssetGroupValueTransaction>();
  for (const transaction of transactions) {
    const current = latestByGroup.get(transaction.groupId);
    if (!current || transaction.recordedAt > current.recordedAt || (transaction.recordedAt.getTime() === current.recordedAt.getTime() && transaction.id > current.id)) latestByGroup.set(transaction.groupId, transaction);
  }
  const summaries = groups.flatMap((group) => {
    const transaction = latestByGroup.get(group.id);
    return transaction ? [{ group, transaction }] : [];
  });

  if (summaries.length === 0) return null;
  const totalValue = summaries.reduce((sum, { transaction }) => sum + transaction.totalValue, 0);

  return <section className="bento-card !mt-3 md:!mt-4"><div className="flex items-center gap-2"><span className="icon-button"><Layers3 size={17}/></span><p className="label">Total latest group value</p></div><h2 className="mt-3 text-3xl font-extrabold tracking-[-.055em]">{formatCurrency(totalValue, "THB")}</h2><p className="mt-1 text-xs text-muted">Combined latest recorded values across {summaries.length} asset groups</p></section>;
}
