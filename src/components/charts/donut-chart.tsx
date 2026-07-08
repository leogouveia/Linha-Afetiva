export type DonutSlice = { label: string; value: number; color: string };

// Simple SVG donut — no charting library, matches "few dependencies" preference.
export function DonutChart({
  title,
  slices,
  emptyLabel,
  size = 160,
  thickness = 22,
}: {
  title: string;
  slices: DonutSlice[];
  emptyLabel: string;
  size?: number;
  thickness?: number;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm dark:border-violet-950 dark:bg-[#1d1728]">
      <h3 className="text-sm font-semibold text-violet-950 dark:text-violet-100">{title}</h3>
      {total === 0 ? (
        <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">{emptyLabel}</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={slices.map((slice) => `${slice.label}: ${slice.value} (${Math.round((slice.value / total) * 100)}%)`).join(", ")}
          >
            <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
              {slices.map((slice) => {
                if (slice.value === 0) return null;
                const length = (slice.value / total) * circumference;
                const dashoffset = -cumulative;
                cumulative += length;
                return (
                  <circle
                    key={slice.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={thickness}
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={dashoffset}
                  >
                    <title>{`${slice.label}: ${slice.value} (${Math.round((slice.value / total) * 100)}%)`}</title>
                  </circle>
                );
              })}
            </g>
          </svg>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            {slices.map((slice) => (
              <li key={slice.label} className="flex items-center gap-2">
                <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                <span>
                  {slice.label} · {slice.value} ({Math.round((slice.value / total) * 100)}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
