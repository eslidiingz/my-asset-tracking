import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
  id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(), image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  username: text("username").unique(), displayUsername: text("display_username"),
  mustChangePassword: integer("must_change_password", { mode: "boolean" }).default(true).notNull(),
});

export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(), expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(), token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(), updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  ipAddress: text("ip_address"), userAgent: text("user_agent"), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => [index("session_user_id_idx").on(table.userId)]);

export const accounts = sqliteTable("account", {
  id: text("id").primaryKey(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), accessToken: text("access_token"), refreshToken: text("refresh_token"),
  idToken: text("id_token"), accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }), refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"), password: text("password"), createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(), updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
}, (table) => [index("account_user_id_idx").on(table.userId)]);

export const assetGroups = sqliteTable("asset_group", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  color: text("color").notNull().default("#C8FF52"),
  visibleInAssetList: integer("visible_in_asset_list", { mode: "boolean" }).notNull().default(true),
}, (table) => [index("asset_group_user_id_idx").on(table.userId)]);

export const verifications = sqliteTable("verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(), expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`), updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);

export const assets = sqliteTable("assets", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: text("user_id").references(() => users.id, { onDelete: "cascade" }), symbol: text("symbol").notNull(),
  category: text("category", { enum: ["Stocks", "Crypto", "Cash", "Property", "Mutual Fund", "Gold", "Private Fund", "TSD"] }).notNull(), units: real("units").notNull(), averagePrice: real("average_price").notNull().default(0), totalCost: real("total_cost"),
  dividendYield: real("dividend_yield"), color: text("color").default("#c8ff52").notNull(), groupId: integer("group_id").references(() => assetGroups.id, { onDelete: "set null" }),
}, (table) => [index("assets_user_id_idx").on(table.userId)]);

export const portfolioSnapshots = sqliteTable("portfolio_snapshot", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recordedAt: integer("recorded_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(), totalValue: real("total_value").notNull(),
}, (table) => [index("portfolio_snapshot_user_date_idx").on(table.userId, table.recordedAt)]);

export const assetGroupValueTransactions = sqliteTable("asset_group_value_transaction", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  groupId: integer("group_id").notNull().references(() => assetGroups.id, { onDelete: "cascade" }),
  totalValue: real("total_value").notNull(),
  recordedAt: integer("recorded_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
}, (table) => [index("asset_group_value_transaction_user_group_date_idx").on(table.userId, table.groupId, table.recordedAt)]);

export const currencySettings = sqliteTable("currency_settings", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  usdToThbRate: real("usd_to_thb_rate").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export const dividendTransactions = sqliteTable("dividend_transaction", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  dividendAmount: real("dividend_amount").notNull(),
  withholdingTax: real("withholding_tax").notNull().default(0),
  receivedAt: integer("received_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
}, (table) => [index("dividend_transaction_user_date_idx").on(table.userId, table.receivedAt)]);

export type Asset = typeof assets.$inferSelect;
export type AssetGroup = typeof assetGroups.$inferSelect;
export type AssetGroupValueTransaction = typeof assetGroupValueTransactions.$inferSelect;
export type CurrencySettings = typeof currencySettings.$inferSelect;
