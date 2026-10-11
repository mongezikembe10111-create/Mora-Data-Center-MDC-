import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatNumber(
  value: number | null | undefined,
  compact = false,
) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(
    "en-ZA",
    compact
      ? { notation: "compact", maximumFractionDigits: 2 }
      : { maximumFractionDigits: 0 },
  ).format(value);
}
export function formatPercent(value: number | null | undefined) {
  return value == null ? "—" : `${value.toFixed(2)}%`;
}
