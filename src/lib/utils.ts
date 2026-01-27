import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string (yyyy-MM-dd) as local date.
 * Avoids the timezone issue where new Date("2026-02-02") is interpreted as UTC midnight,
 * which displays as the previous day in timezones west of UTC.
 */
export function formatDateString(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}
