"use server";

import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { assetGroups, assets, dividendTransactions, portfolioSnapshots } from "@/db/schema";
import { auth } from "@/lib/auth";

export type AssetFormState = { error: string; success: boolean };
export type DividendFormState = AssetFormState;
const groupIdSchema = z.preprocess((value) => value === "" || value === null ? null : value, z.coerce.number().int().positive().nullable());
const assetSchema = z.object({ symbol: z.string().trim().min(1).max(12).regex(/^[A-Za-z]+$/), category: z.enum(["Stocks", "Crypto", "Cash", "Property"]), units: z.coerce.number().positive(), averagePrice: z.coerce.number().nonnegative(), dividendYield: z.coerce.number().min(0).max(100).optional(), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), groupId: groupIdSchema });
const editAssetSchema = assetSchema.extend({ id: z.coerce.number().int().positive() });
const deleteAssetSchema = z.object({ id: z.coerce.number().int().positive() });
const groupSchema = z.object({ name: z.string().trim().min(1).max(40) });
const groupIdOnlySchema = z.object({ id: z.coerce.number().int().positive() });
const bulkMoveSchema = z.object({ assetIds: z.array(z.coerce.number().int().positive()).min(1), groupId: groupIdSchema });

async function validGroupId(groupId: number | null, userId: string) {
  if (groupId === null) return true;
  const [group] = await db.select({ id: assetGroups.id }).from(assetGroups).where(and(eq(assetGroups.id, groupId), eq(assetGroups.userId, userId))).limit(1);
  return Boolean(group);
}

export async function addAsset(_state: AssetFormState, formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = assetSchema.safeParse({ symbol: formData.get("symbol"), category: formData.get("category"), units: formData.get("units"), averagePrice: formData.get("averagePrice"), dividendYield: formData.get("dividendYield") || undefined, color: formData.get("color") || "#c8ff52", groupId: formData.get("groupId") });
  if (!parsed.success) return { error: "Check the asset details and try again.", success: false };
  const asset = parsed.data;
  if (!await validGroupId(asset.groupId, session.user.id)) return { error: "Choose a valid asset group.", success: false };
  await db.insert(assets).values({ ...asset, symbol: asset.symbol.toUpperCase(), userId: session.user.id, dividendYield: asset.category === "Stocks" ? asset.dividendYield ?? null : null });
  const holdings = await db.select({ units: assets.units, averagePrice: assets.averagePrice }).from(assets).where(eq(assets.userId, session.user.id));
  const totalValue = holdings.reduce((total, holding) => total + holding.units * holding.averagePrice, 0);
  await db.insert(portfolioSnapshots).values({ userId: session.user.id, totalValue });
  revalidatePath("/");
  revalidatePath("/assets");
  return { error: "", success: true };
}

export async function updateAsset(_state: AssetFormState, formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = editAssetSchema.safeParse({ id: formData.get("id"), symbol: formData.get("symbol"), category: formData.get("category"), units: formData.get("units"), averagePrice: formData.get("averagePrice"), dividendYield: formData.get("dividendYield") || undefined, color: formData.get("color") || "#c8ff52", groupId: formData.get("groupId") });
  if (!parsed.success) return { error: "Check the asset details and try again.", success: false };
  const { id, ...asset } = parsed.data;
  if (!await validGroupId(asset.groupId, session.user.id)) return { error: "Choose a valid asset group.", success: false };
  await db.update(assets).set({ ...asset, symbol: asset.symbol.toUpperCase(), dividendYield: asset.category === "Stocks" ? asset.dividendYield ?? null : null }).where(and(eq(assets.id, id), eq(assets.userId, session.user.id)));
  const holdings = await db.select({ units: assets.units, averagePrice: assets.averagePrice }).from(assets).where(eq(assets.userId, session.user.id));
  const totalValue = holdings.reduce((total, holding) => total + holding.units * holding.averagePrice, 0);
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
  const holdings = await db.select({ units: assets.units, averagePrice: assets.averagePrice }).from(assets).where(eq(assets.userId, session.user.id));
  const totalValue = holdings.reduce((total, holding) => total + holding.units * holding.averagePrice, 0);
  await db.insert(portfolioSnapshots).values({ userId: session.user.id, totalValue });
  revalidatePath("/");
  revalidatePath("/assets");
  revalidatePath("/dividends");
  return { error: "", success: true };
}

export async function createAssetGroup(formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = groupSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: "Enter a group name up to 40 characters.", success: false };
  const [existing] = await db.select({ id: assetGroups.id }).from(assetGroups).where(and(eq(assetGroups.userId, session.user.id), eq(assetGroups.name, parsed.data.name))).limit(1);
  if (existing) return { error: "A group with this name already exists.", success: false };
  await db.insert(assetGroups).values({ userId: session.user.id, name: parsed.data.name });
  revalidatePath("/"); revalidatePath("/assets"); revalidatePath("/dividends");
  return { error: "", success: true };
}

export async function renameAssetGroup(formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = groupSchema.extend({ id: z.coerce.number().int().positive() }).safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) return { error: "Enter a group name up to 40 characters.", success: false };
  await db.update(assetGroups).set({ name: parsed.data.name }).where(and(eq(assetGroups.id, parsed.data.id), eq(assetGroups.userId, session.user.id)));
  revalidatePath("/"); revalidatePath("/assets"); revalidatePath("/dividends");
  return { error: "", success: true };
}

export async function deleteAssetGroup(formData: FormData): Promise<AssetFormState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.mustChangePassword) return { error: "Your session has expired. Please sign in again.", success: false };
  const parsed = groupIdOnlySchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "This group could not be deleted.", success: false };
  await db.update(assets).set({ groupId: null }).where(and(eq(assets.groupId, parsed.data.id), eq(assets.userId, session.user.id)));
  await db.delete(assetGroups).where(and(eq(assetGroups.id, parsed.data.id), eq(assetGroups.userId, session.user.id)));
  revalidatePath("/"); revalidatePath("/assets"); revalidatePath("/dividends");
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

const dividendSchema = z.object({
  symbol: z.string().trim().min(1).max(12).regex(/^[A-Za-z]+$/),
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
