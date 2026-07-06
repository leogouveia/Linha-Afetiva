import type { DatePrecision } from "@/lib/validation/event";

const dayFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });
const monthFormat = new Intl.DateTimeFormat("pt-BR", { month: "2-digit", year: "numeric", timeZone: "UTC" });
const monthYearFormat = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

// Used to group timeline entries under a separator, e.g. "Junho de 2026".
export function formatMonthYear(date: Date) {
  const label = monthYearFormat.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Dates are stored as UTC midnight; format in UTC to avoid off-by-one shifts.
export function formatEventDate(date: Date, precision: string) {
  switch (precision as DatePrecision) {
    case "month":
      return monthFormat.format(date);
    case "year":
      return String(date.getUTCFullYear());
    case "approx":
      return `~${date.getUTCFullYear()}`;
    default:
      return dayFormat.format(date);
  }
}
