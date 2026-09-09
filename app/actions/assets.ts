"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { client, db } from "@/db";
import { assetGroupValueTransactions, assetGroups, assets, dividendTransactions, portfolioSnapshots } from "@/db/schema";
import { auth } from "@/lib/auth";

export type AssetFormState = { error: string; success: boolean };
export type DividendFormState = AssetFormState;
const groupIdSchema = z.preprocess((value) => value === "" || value === null ? null : value, z.coerce.number().int().positive().nullable());
const totalCostSchema = z.preprocess((value) => value === "" || value === null ? null : value, z.coerce.number().nonnegative().nullable());
const assetSchema = z.object({ symbol: z.string().trim().min(1).max(30).regex(/^[A-Za-z0-9() -]+$/), category: z.enum(["Stocks", "Crypto", "Cash", "Property", "Mutual Fund", "Gold", "Private Fund", "TSD"]), units: z.preprocess((value) => value === "" || value === null ? 0 : value, z.coerce.number().nonnegative()), averagePrice: z.coerce.number().nonnegative(), totalCost: totalCostSchema, dividendYield: z.coerce.number().min(0).max(100).optional(), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), groupId: groupIdSchema }).superRefine((asset, context) => { if (asset.category !== "Private Fund" && asset.units <= 0) context.addIssue({ code: "custom", path: ["units"], message: "Units must be greater than 0." }); });
const editAssetSchema = assetSchema.extend({ id: z.coerce.number().int().positive() });
const deleteAssetSchema = z.object({ id: z.coerce.number().int().positive() });
const groupSchema = z.object({ name: z.string().trim().min(1).max(40), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#C8FF52"), visibleInAssetList: z.preprocess((value) => value === true || value === "true", z.boolean()).default(true) });
const groupIdOnlySchema = z.object({ id: z.coerce.number().int().positive() });
const groupOrderSchema = z.object({ groupIds: z.array(z.number().int().positive()) });
const bulkMoveSchema = z.object({ assetIds: z.array(z.coerce.number().int().positive()).min(1), groupId: groupIdSchema });
const groupValueUpdateSchema = z.object({
  groupId: z.number().int().positive(),
  totalValue: z.number().nonnegative(),
});
const groupValueBatchSchema = z.object({
  updates: z.array(groupValueUpdateSchema).min(1),
  recordedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
const groupValueTransactionEditSchema = z.object({
  id: z.coerce.number().int().positive(),
  totalValue: z.coerce.number().nonnegative(),
  recordedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
const groupValueTransactionBatchEditSchema = z.object({
  updates: z.array(z.object({ id: z.number().int().positive(), totalValue: z.number().nonnegative() })).min(1),
  recordedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

async function validGroupId(groupId: number | null, userId: string) {
  if (groupId === null) return true;
  const [group] = await db.select({ id: assetGroups.id }).from(assetGroups).where(and(eq(assetGroups.id, groupId), eq(assetGroups.userId, userId))).limit(1);
  return Boolean(group);
}

export async function addAsset(_state: AssetFormState, formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = assetSchema.safeParse({ symbol: formData.get("symbol"), category: formData.get("category"), units: formData.get("units"), averagePrice: formData.get("averagePrice"), totalCost: formData.get("totalCost"), dividendYield: formData.get("dividendYield") || undefined, color: formData.get("color") || "#c8ff52", groupId: formData.get("groupId") });
  if (!parsed.success) return { error: "Check the asset details and try again.", success: false };
  const asset = parsed.data;
  if (!await validGroupId(asset.groupId, session.user.id)) return { error: "Choose a valid asset group.", success: false };
  await db.insert(assets).values({ ...asset, symbol: asset.symbol.toUpperCase(), userId: session.user.id, dividendYield: asset.category === "Stocks" ? asset.dividendYield ?? null : null });
  const holdings = await db.select({ units: assets.units, averagePrice: assets.averagePrice, totalCost: assets.totalCost }).from(assets).where(eq(assets.userId, session.user.id));
  const totalValue = holdings.reduce((total, holding) => total + (holding.totalCost ?? holding.units * holding.averagePrice), 0);
  await db.insert(portfolioSnapshots).values({ userId: session.user.id, totalValue });
  revalidatePath("/");
  revalidatePath("/assets");
  return { error: "", success: true };
}

export async function updateAsset(_state: AssetFormState, formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = editAssetSchema.safeParse({ id: formData.get("id"), symbol: formData.get("symbol"), category: formData.get("category"), units: formData.get("units"), averagePrice: formData.get("averagePrice"), totalCost: formData.get("totalCost"), dividendYield: formData.get("dividendYield") || undefined, color: formData.get("color") || "#c8ff52", groupId: formData.get("groupId") });
  if (!parsed.success) return { error: "Check the asset details and try again.", success: false };
  const { id, ...asset } = parsed.data;
  if (!await validGroupId(asset.groupId, session.user.id)) return { error: "Choose a valid asset group.", success: false };
  await db.update(assets).set({ ...asset, symbol: asset.symbol.toUpperCase(), dividendYield: asset.category === "Stocks" ? asset.dividendYield ?? null : null }).where(and(eq(assets.id, id), eq(assets.userId, session.user.id)));
  const holdings = await db.select({ units: assets.units, averagePrice: assets.averagePrice, totalCost: assets.totalCost }).from(assets).where(eq(assets.userId, session.user.id));
  const totalValue = holdings.reduce((total, holding) => total + (holding.totalCost ?? holding.units * holding.averagePrice), 0);
  await db.insert(portfolioSnapshots).values({ userId: session.user.id, totalValue });
  revalidatePath("/");
  revalidatePath("/assets");
  revalidatePath("/dividends");
  return { error: "", success: true };
}

export async function deleteAsset(_state: AssetFormState, formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = deleteAssetSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "This asset could not be deleted.", success: false };
  await db.delete(assets).where(and(eq(assets.id, parsed.data.id), eq(assets.userId, session.user.id)));
  const holdings = await db.select({ units: assets.units, averagePrice: assets.averagePrice, totalCost: assets.totalCost }).from(assets).where(eq(assets.userId, session.user.id));
  const totalValue = holdings.reduce((total, holding) => total + (holding.totalCost ?? holding.units * holding.averagePrice), 0);
  await db.insert(portfolioSnapshots).values({ userId: session.user.id, totalValue });
  revalidatePath("/");
  revalidatePath("/assets");
  revalidatePath("/dividends");
  return { error: "", success: true };
}

export async function createAssetGroup(formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = groupSchema.safeParse({ name: formData.get("name"), color: formData.get("color") || undefined, visibleInAssetList: formData.get("visibleInAssetList") ?? true });
  if (!parsed.success) return { error: "Enter a group name up to 40 characters.", success: false };
  const [existing] = await db.select({ id: assetGroups.id }).from(assetGroups).where(and(eq(assetGroups.userId, session.user.id), eq(assetGroups.name, parsed.data.name))).limit(1);
  if (existing) return { error: "A group with this name already exists.", success: false };
  const [{ nextSortOrder }] = await db.select({ nextSortOrder: sql<number>`coalesce(max(${assetGroups.sortOrder}), -1) + 1` }).from(assetGroups).where(eq(assetGroups.userId, session.user.id));
  await db.insert(assetGroups).values({ userId: session.user.id, name: parsed.data.name, color: parsed.data.color, visibleInAssetList: parsed.data.visibleInAssetList, sortOrder: nextSortOrder });
  revalidatePath("/"); revalidatePath("/assets"); revalidatePath("/dividends"); revalidatePath("/settings");
  return { error: "", success: true };
}

export async function renameAssetGroup(formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = groupSchema.extend({ id: z.coerce.number().int().positive() }).safeParse({ id: formData.get("id"), name: formData.get("name"), color: formData.get("color") || undefined, visibleInAssetList: formData.get("visibleInAssetList") });
  if (!parsed.success) return { error: "Enter a group name up to 40 characters.", success: false };
  await db.update(assetGroups).set({ name: parsed.data.name, color: parsed.data.color, visibleInAssetList: parsed.data.visibleInAssetList }).where(and(eq(assetGroups.id, parsed.data.id), eq(assetGroups.userId, session.user.id)));
  revalidatePath("/"); revalidatePath("/assets"); revalidatePath("/dividends"); revalidatePath("/settings");
  return { error: "", success: true };
}

export async function deleteAssetGroup(formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = groupIdOnlySchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "This group could not be deleted.", success: false };
  await db.update(assets).set({ groupId: null }).where(and(eq(assets.groupId, parsed.data.id), eq(assets.userId, session.user.id)));
  await db.delete(assetGroups).where(and(eq(assetGroups.id, parsed.data.id), eq(assetGroups.userId, session.user.id)));
  revalidatePath("/"); revalidatePath("/assets"); revalidatePath("/dividends"); revalidatePath("/settings");
  return { error: "", success: true };
}

export async function reorderAssetGroups(formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };

  const rawGroupIds = formData.get("groupIds");
  if (typeof rawGroupIds !== "string") return { error: "The group order could not be saved.", success: false };
  const parsed = groupOrderSchema.safeParse({ groupIds: (() => { try { return JSON.parse(rawGroupIds); } catch { return null; } })() });
  if (!parsed.success || new Set(parsed.data.groupIds).size !== parsed.data.groupIds.length) return { error: "The group order could not be saved.", success: false };

  const ownedGroups = await db.select({ id: assetGroups.id }).from(assetGroups).where(eq(assetGroups.userId, session.user.id));
  if (ownedGroups.length !== parsed.data.groupIds.length || !parsed.data.groupIds.every((id) => ownedGroups.some((group) => group.id === id))) return { error: "The group order could not be saved.", success: false };
  await db.transaction(async (tx) => {
    await Promise.all(parsed.data.groupIds.map((id, sortOrder) => tx.update(assetGroups).set({ sortOrder }).where(and(eq(assetGroups.id, id), eq(assetGroups.userId, session.user.id)))));
  });
  revalidatePath("/"); revalidatePath("/assets"); revalidatePath("/dividends"); revalidatePath("/settings");
  return { error: "", success: true };
}

export async function moveAssetsToGroup(formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = bulkMoveSchema.safeParse({ assetIds: formData.getAll("assetIds"), groupId: formData.get("groupId") });
  if (!parsed.success) return { error: "Select at least one asset and a valid group.", success: false };
  if (!await validGroupId(parsed.data.groupId, session.user.id)) return { error: "Choose a valid asset group.", success: false };
  await db.update(assets).set({ groupId: parsed.data.groupId }).where(and(inArray(assets.id, parsed.data.assetIds), eq(assets.userId, session.user.id)));
  revalidatePath("/"); revalidatePath("/assets"); revalidatePath("/dividends");
  return { error: "", success: true };
}

export async function updateAssetGroupValues(formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const rawUpdates = formData.get("updates");
  const parsed = groupValueBatchSchema.safeParse({ updates: typeof rawUpdates === "string" ? (() => { try { return JSON.parse(rawUpdates); } catch { return null; } })() : null, recordedAt: formData.get("recordedAt") });
  if (!parsed.success || new Set(parsed.data.updates.map((update) => update.groupId)).size !== parsed.data.updates.length) return { error: "Enter one valid value for each selected group and choose a date.", success: false };
  const { updates, recordedAt } = parsed.data;
  const groupIds = updates.map((update) => update.groupId);
  const ownedGroups = await db.select({ id: assetGroups.id }).from(assetGroups).where(and(eq(assetGroups.userId, session.user.id), inArray(assetGroups.id, groupIds)));
  if (ownedGroups.length !== groupIds.length) return { error: "Choose valid asset groups.", success: false };

  const userAssets = await db.select({ id: assets.id, groupId: assets.groupId, units: assets.units, averagePrice: assets.averagePrice, totalCost: assets.totalCost })
    .from(assets)
    .where(eq(assets.userId, session.user.id));
  const assetsByGroup = new Map<number, typeof userAssets>();
  for (const asset of userAssets) {
    if (asset.groupId === null || !groupIds.includes(asset.groupId)) continue;
    assetsByGroup.set(asset.groupId, [...(assetsByGroup.get(asset.groupId) ?? []), asset]);
  }
  const allocatedAssetValues = new Map<number, number>();
  for (const update of updates) {
    const assetsInGroup = assetsByGroup.get(update.groupId) ?? [];
    const currentTotal = assetsInGroup.reduce((sum, asset) => sum + (asset.totalCost ?? asset.units * asset.averagePrice), 0);
    let allocatedValue = 0;
    for (const [index, asset] of assetsInGroup.entries()) {
      const isLastAsset = index === assetsInGroup.length - 1;
      const currentValue = asset.totalCost ?? asset.units * asset.averagePrice;
      const nextValue = isLastAsset
        ? update.totalValue - allocatedValue
        : currentTotal > 0
          ? update.totalValue * currentValue / currentTotal
          : update.totalValue / assetsInGroup.length;
      allocatedValue += nextValue;
      allocatedAssetValues.set(asset.id, nextValue);
    }
  }
  const portfolioValue = userAssets.reduce((sum, asset) => sum + (allocatedAssetValues.get(asset.id) ?? asset.totalCost ?? asset.units * asset.averagePrice), 0);
  const recordedAtEpoch = Math.floor(new Date(`${recordedAt}T12:00:00`).getTime() / 1_000);
  const batchStatements = [
    ...[...allocatedAssetValues.entries()].map(([assetId, totalCost]) => ({ sql: "UPDATE assets SET total_cost = ? WHERE id = ? AND user_id = ?", args: [totalCost, assetId, session.user.id] })),
    {
      sql: `INSERT INTO asset_group_value_transaction (user_id, group_id, total_value, recorded_at) VALUES ${updates.map(() => "(?, ?, ?, ?)").join(", ")}`,
      args: updates.flatMap((update) => [session.user.id, update.groupId, update.totalValue, recordedAtEpoch]),
    },
    { sql: "INSERT INTO portfolio_snapshot (user_id, total_value, recorded_at) VALUES (?, ?, ?)", args: [session.user.id, portfolioValue, recordedAtEpoch] },
  ];
  await client.batch(batchStatements);
  revalidatePath("/");
  revalidatePath("/assets");
  return { error: "", success: true };
}

export async function updateAssetGroupValueTransaction(formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = groupValueTransactionEditSchema.safeParse({ id: formData.get("id"), totalValue: formData.get("totalValue"), recordedAt: formData.get("recordedAt") });
  if (!parsed.success) return { error: "Enter a valid value and date.", success: false };
  const updated = await db.update(assetGroupValueTransactions).set({ totalValue: parsed.data.totalValue, recordedAt: new Date(`${parsed.data.recordedAt}T12:00:00`) }).where(and(eq(assetGroupValueTransactions.id, parsed.data.id), eq(assetGroupValueTransactions.userId, session.user.id))).returning({ id: assetGroupValueTransactions.id });
  if (updated.length === 0) return { error: "This group-value transaction could not be found.", success: false };
  revalidatePath("/");
  return { error: "", success: true };
}

export async function updateAssetGroupValueTransactions(formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const rawUpdates = formData.get("updates");
  const parsed = groupValueTransactionBatchEditSchema.safeParse({ updates: typeof rawUpdates === "string" ? (() => { try { return JSON.parse(rawUpdates); } catch { return null; } })() : null, recordedAt: formData.get("recordedAt") });
  if (!parsed.success || new Set(parsed.data.updates.map((update) => update.id)).size !== parsed.data.updates.length) return { error: "Check the group values and date, then try again.", success: false };
  const ids = parsed.data.updates.map((update) => update.id);
  const ownedTransactions = await db.select({ id: assetGroupValueTransactions.id }).from(assetGroupValueTransactions).where(and(eq(assetGroupValueTransactions.userId, session.user.id), inArray(assetGroupValueTransactions.id, ids)));
  if (ownedTransactions.length !== ids.length) return { error: "One or more group-value transactions could not be found.", success: false };
  await db.transaction(async (tx) => {
    await Promise.all(parsed.data.updates.map((update) => tx.update(assetGroupValueTransactions).set({ totalValue: update.totalValue, recordedAt: new Date(`${parsed.data.recordedAt}T12:00:00`) }).where(and(eq(assetGroupValueTransactions.id, update.id), eq(assetGroupValueTransactions.userId, session.user.id)))));
  });
  revalidatePath("/");
  return { error: "", success: true };
}

const dividendSchema = z.object({
  symbol: z.string().trim().min(1).max(30).regex(/^[A-Za-z0-9() -]+$/),
  dividendAmount: z.coerce.number().positive(),
  withholdingTax: z.coerce.number().nonnegative(),
  receivedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function addDividendTransaction(_state: DividendFormState, formData: FormData): Promise<DividendFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = dividendSchema.safeParse({
    symbol: formData.get("symbol"), dividendAmount: formData.get("dividendAmount"),
    withholdingTax: formData.get("withholdingTax") || 0, receivedAt: formData.get("receivedAt"),
  });
  if (!parsed.success) return { error: "Check the dividend details and try again.", success: false };
  const transaction = parsed.data;
  const symbol = transaction.symbol.toUpperCase();
  const [asset] = await db.select({ id: assets.id }).from(assets).where(and(eq(assets.userId, session.user.id), eq(assets.symbol, symbol), eq(assets.category, "Stocks"))).limit(1);
  if (!asset) return { error: "Choose a stock symbol from your asset list.", success: false };
  await db.insert(dividendTransactions).values({
    userId: session.user.id, symbol, dividendAmount: transaction.dividendAmount,
    withholdingTax: transaction.withholdingTax, receivedAt: new Date(`${transaction.receivedAt}T12:00:00`),
  });
  revalidatePath("/assets");
  return { error: "", success: true };
}
