export type HistogramBar = { label: string; value: number; color?: string };

// Same visual language as StatBlock (a progress-bar list), but preserves the caller's
// order instead of ranking by frequency — used when the order itself is meaningful
// (an emotional-tone scale, duration buckets, chronological months).
export function Histogram({
  title,
  bars,
  emptyLabel,
  maxOverride,
}: {
  title: string;
  bars: HistogramBar[];
  emptyLabel: string;
  maxOverride?: number;
}) {
  const max = maxOverride ?? Math.max(0, ...bars.map((bar) => bar.value));
  const hasData = bars.some((bar) => bar.value > 0);

  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm dark:border-violet-950 dark:bg-[#1d1728]">
      <h3 className="text-sm font-semibold text-violet-950 dark:text-violet-100">{title}</h3>
      {!hasData ? (
        <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {bars.map((bar) => (
            <li key={bar.label}>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>{bar.label}</span>
                <span>{bar.value}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-violet-50 dark:bg-violet-950/50">
                <div
                  className={`h-full rounded-full ${bar.color ? "" : "bg-violet-400 dark:bg-violet-600"}`}
                  style={{ width: `${max ? (bar.value / max) * 100 : 0}%`, backgroundColor: bar.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
