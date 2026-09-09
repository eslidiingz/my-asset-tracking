import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currencyForAssetCategory(category: string) {
  return category === "Mutual Fund" || category === "Private Fund" || category === "TSD" ? "THB" : "USD";
}

export function assetCost(asset: { totalCost: number | null; units: number; averagePrice: number }) {
  return asset.totalCost ?? asset.units * asset.averagePrice;
}

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
