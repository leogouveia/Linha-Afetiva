import type { StatItem } from "@/components/stat-block";

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
