import type { StatItem } from "@/components/stat-block";
import type { DonutSlice } from "@/components/charts/donut-chart";
import type { HistogramBar } from "@/components/charts/histogram";
import { formatMonthShort } from "@/lib/dates";
import { emotionalTones, emotionalToneLabels, eventStatuses, eventStatusLabels, type EmotionalTone, type EventStatus } from "@/lib/validation/event";
import { personOrigins } from "@/lib/validation/person";
import { tagColors } from "@/lib/validation/tag";

// Ranks non-null keys by frequency, most common first.
export function countBy<T>(items: T[], key: (item: T) => string | null): StatItem[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = key(item);
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export type PersonForStats = { id: number; origin: string; currentStatus: string; startedAt: Date | null; endedAt: Date | null };

export function buildOriginSlices(people: PersonForStats[]): DonutSlice[] {
  const counts = new Map<string, number>();
  for (const person of people) counts.set(person.origin, (counts.get(person.origin) ?? 0) + 1);
  return personOrigins.map((origin, index) => ({ label: origin, value: counts.get(origin) ?? 0, color: tagColors[index % tagColors.length] }));
}

// Same semantics as statusBadgeClass (src/components/status-badge.ts) translated to hex for SVG fill.
const statusColors: Record<EventStatus, string> = { active: "#10b981", paused: "#f59e0b", ended: "#64748b", undefined: "#cbd5e1" };

export function buildStatusSlices(people: PersonForStats[]): DonutSlice[] {
  const counts = new Map<string, number>();
  for (const person of people) counts.set(person.currentStatus, (counts.get(person.currentStatus) ?? 0) + 1);
  return eventStatuses.map((status) => ({ label: eventStatusLabels[status], value: counts.get(status) ?? 0, color: statusColors[status] }));
}

export const toneColors: Record<EmotionalTone, string> = {
  "muito-bom": "#10b981",
  bom: "#6ee7b7",
  neutro: "#94a3b8",
  confuso: "#f59e0b",
  ruim: "#f87171",
  "muito-ruim": "#ef4444",
};

// Ordered by the tone scale itself, not by frequency — the order is the data.
export function buildToneBuckets(events: { emotionalTone: string | null }[]): HistogramBar[] {
  const counts = new Map<string, number>();
  for (const event of events) if (event.emotionalTone) counts.set(event.emotionalTone, (counts.get(event.emotionalTone) ?? 0) + 1);
  return emotionalTones.map((tone) => ({ label: emotionalToneLabels[tone], value: counts.get(tone) ?? 0, color: toneColors[tone] }));
}

function monthsBetween(start: Date, end: Date) {
  return (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
}

const durationBucketLabels = ["< 1 mês", "1–3 meses", "3–6 meses", "6–12 meses", "1–2 anos", "2+ anos"];

function durationBucketIndex(months: number) {
  if (months < 1) return 0;
  if (months < 3) return 1;
  if (months < 6) return 2;
  if (months < 12) return 3;
  if (months < 24) return 4;
  return 5;
}

export type DurationSummary = { count: number; medianMonths: number | null; averageMonths: number | null; buckets: HistogramBar[] };

// Cohort: only relationships explicitly marked "ended" with both dates set — no fallback
// to the most recent event's date, matching the deliberately-simple status-sync rule.
export function buildDurationSummary(people: PersonForStats[]): DurationSummary {
  const durations = people
    .filter((person) => person.currentStatus === "ended" && person.startedAt && person.endedAt)
    .map((person) => monthsBetween(person.startedAt as Date, person.endedAt as Date))
    .filter((months) => months >= 0)
    .sort((a, b) => a - b);

  const bucketCounts = new Array(durationBucketLabels.length).fill(0);
  for (const months of durations) bucketCounts[durationBucketIndex(months)]++;

  const count = durations.length;
  const medianMonths = count === 0 ? null : count % 2 === 1 ? durations[(count - 1) / 2] : (durations[count / 2 - 1] + durations[count / 2]) / 2;
  const averageMonths = count === 0 ? null : durations.reduce((sum, months) => sum + months, 0) / count;

  return { count, medianMonths, averageMonths, buckets: durationBucketLabels.map((label, index) => ({ label, value: bucketCounts[index] })) };
}

// Last `monthsBack` calendar months ending today, in chronological order — including
// months with zero events, so a quiet stretch is visible rather than skipped.
export function buildEventFrequencyByMonth(events: { date: Date }[], monthsBack = 12): HistogramBar[] {
  const now = new Date();
  const months = Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthsBack - 1 - i), 1));
    return { key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`, label: formatMonthShort(d) };
  });
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = `${event.date.getUTCFullYear()}-${event.date.getUTCMonth()}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return months.map(({ key, label }) => ({ label, value: counts.get(key) ?? 0 }));
}
