export type StatItem = { label: string; count: number };

// Simple ranked bar list — no charting library, matches "few dependencies" preference.
export function StatBlock({ title, items, emptyLabel }: { title: string; items: StatItem[]; emptyLabel: string }) {
  const max = items[0]?.count ?? 0;
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm dark:border-violet-950 dark:bg-[#1d1728]">
      <h3 className="text-sm font-semibold text-violet-950 dark:text-violet-100">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.slice(0, 6).map((item) => (
            <li key={item.label}>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>{item.label}</span>
                <span>{item.count}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-violet-50 dark:bg-violet-950/50">
                <div className="h-full rounded-full bg-violet-400 dark:bg-violet-600" style={{ width: `${max ? (item.count / max) * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
