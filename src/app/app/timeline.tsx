"use client";
import Link from "next/link";
import { FormEvent, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { statusBadgeClass } from "@/components/status-badge";
import { PersonAutocomplete } from "@/components/person-autocomplete";
import { eventScopeTags, TagMultiSelect, type TagOption } from "@/components/tag-select";
import { formatEventDate, formatMonthYear } from "@/lib/dates";
import { getPersonColor } from "@/lib/colors";
import { emotionalToneLabels, eventStatusLabels, eventStatuses, outcomeLabels, type EmotionalTone, type EventStatus, type Outcome } from "@/lib/validation/event";

export type PersonOption = { id: number; name: string };
export type { TagOption };
export type TimelineEntry = {
  id: number;
  personId: number;
  personName: string;
  avatarDataUrl: string | null;
  date: Date;
  datePrecision: string;
  status: string;
  title: string | null;
  outcome: string | null;
  emotionalTone: string | null;
  tags: TagOption[];
};

type Segment = { personId: number; top: number; height: number; lane: number };

// Trunk sits at the center of the 64px gutter column (see grid-cols-[64px_...] below);
// -1px compensates for the dashed border's own width so it renders visually centered.
const TRUNK_X = 31;
// Lanes spread on both sides of the trunk so all 4 fit inside the 64px gutter
// (|offset| must stay <= 16: 64/2 - |offset| - 16 (half the dot's width) >= 0).
const LANE_OFFSETS = [-12, -4, 4, 12];
const inputClass =
  "rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-violet-900 dark:bg-violet-950/30 dark:focus:border-violet-500 dark:focus:ring-violet-950";

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

// Small edit-distance check to catch typos of an existing person's name before
// silently creating a duplicate — the quick composer has no other confirmation step.
function levenshtein(a: string, b: string) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
    }
  }
  return rows[a.length][b.length];
}

function findCloseMatch(name: string, people: PersonOption[]) {
  const normalized = normalizeName(name);
  let closest: PersonOption | null = null;
  let closestDistance = Infinity;
  for (const person of people) {
    const distance = levenshtein(normalized, normalizeName(person.name));
    if (distance < closestDistance) {
      closest = person;
      closestDistance = distance;
    }
  }
  return closest && closestDistance > 0 && closestDistance <= 2 ? closest : null;
}

function Composer({ people, allTags }: { people: PersonOption[]; allTags: TagOption[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayInput);
  const [status, setStatus] = useState<EventStatus>("undefined");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const dropdownOptions = eventScopeTags(allTags);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const trimmedName = name.trim();
    const trimmedTitle = title.trim();
    if (!trimmedName) {
      setError("Informe o nome da pessoa.");
      return;
    }
    if (!trimmedTitle) {
      setError("Informe o título do registro.");
      return;
    }
    const existing = people.find((person) => normalizeName(person.name) === normalizeName(trimmedName));
    if (!existing) {
      const closeMatch = findCloseMatch(trimmedName, people);
      if (closeMatch && !window.confirm(`Já existe uma pessoa chamada "${closeMatch.name}". Criar "${trimmedName}" como pessoa nova mesmo assim?`)) return;
    }
    setSaving(true);
    const body = existing
      ? { personId: existing.id, date, datePrecision: "day", title: trimmedTitle, status, tagIds }
      : { name: trimmedName, origin: "Não informado", date, datePrecision: "day", title: trimmedTitle, status, tagIds };
    const response = await fetch(existing ? "/api/events" : "/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível registrar.");
      return;
    }
    setName("");
    setTitle("");
    setStatus("undefined");
    setTagIds([]);
    setDate(todayInput());
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm dark:border-violet-950 dark:bg-[#1d1728]">
      <div className="flex flex-wrap gap-2">
        <PersonAutocomplete people={people} value={name} onChange={setName} placeholder="Pessoa" />
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required className={inputClass} />
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título do registro"
          maxLength={200}
          className={`${inputClass} min-w-[10rem] flex-1`}
        />
        <select value={status} onChange={(event) => setStatus(event.target.value as EventStatus)} className={inputClass}>
          {eventStatuses.map((value) => (
            <option key={value} value={value}>
              {eventStatusLabels[value]}
            </option>
          ))}
        </select>
        <button disabled={saving} className="rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-800 disabled:opacity-60">
          {saving ? "Registrando…" : "Registrar"}
        </button>
      </div>
      {allTags.length > 0 && (
        <div className="mt-3">
          <TagMultiSelect options={allTags} dropdownOptions={dropdownOptions} value={tagIds} onChange={setTagIds} placeholder="Tags do evento" />
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
    </form>
  );
}

export function Timeline({ entries, people, allTags }: { entries: TimelineEntry[]; people: PersonOption[]; allTags: TagOption[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef(new Map<number, HTMLSpanElement>());
  const [segments, setSegments] = useState<Segment[]>([]);

  const multiEventPersonIds = [...new Set(entries.map((entry) => entry.personId))].filter(
    (id) => entries.filter((entry) => entry.personId === id).length > 1
  );
  const laneByPerson = new Map<number, number>();
  multiEventPersonIds.forEach((id, i) => laneByPerson.set(id, LANE_OFFSETS[i % LANE_OFFSETS.length]));

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerTop = container.getBoundingClientRect().top;
    const positionsByPerson = new Map<number, number[]>();
    for (const entry of entries) {
      const dot = dotRefs.current.get(entry.id);
      if (!dot) continue;
      const rect = dot.getBoundingClientRect();
      const centerY = rect.top - containerTop + rect.height / 2;
      const list = positionsByPerson.get(entry.personId) ?? [];
      list.push(centerY);
      positionsByPerson.set(entry.personId, list);
    }
    const nextSegments: Segment[] = [];
    positionsByPerson.forEach((positions, personId) => {
      if (positions.length < 2) return;
      const lane = laneByPerson.get(personId) ?? 0;
      for (let i = 0; i < positions.length - 1; i++)
        nextSegments.push({ personId, top: positions[i], height: positions[i + 1] - positions[i], lane });
    });
    setSegments(nextSegments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  let lastMonthKey = "";

  return (
    <div>
      <Composer people={people} allTags={allTags} />
      {entries.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-violet-200 p-10 text-center text-slate-500 dark:border-violet-900 dark:text-slate-400">
          Nenhum registro ainda. Use o campo acima para começar.
        </p>
      ) : (
        <div ref={containerRef} className="relative mt-8">
          <div className="absolute top-2 bottom-2 w-0.5 bg-violet-100 dark:bg-violet-950" style={{ left: TRUNK_X }} />
          {segments.map((segment, index) => (
            <div
              key={index}
              aria-hidden
              style={{ position: "absolute", left: TRUNK_X - segment.lane, top: segment.top, height: segment.height, borderLeft: `2px dashed ${getPersonColor(segment.personId)}` }}
            />
          ))}
          <ul>
            {entries.map((entry, index) => {
              const monthKey = formatMonthYear(entry.date);
              const showSeparator = monthKey !== lastMonthKey;
              lastMonthKey = monthKey;
              const status = entry.status as EventStatus;
              const outcome = entry.outcome as Outcome | null;
              const emotionalTone = entry.emotionalTone as EmotionalTone | null;
              const color = getPersonColor(entry.personId);
              const lane = laneByPerson.get(entry.personId) ?? 0;
              return (
                <li key={entry.id}>
                  {showSeparator && <p className="relative z-10 ml-16 mt-6 mb-2 text-xs font-medium text-slate-400 first:mt-0 dark:text-slate-500">{monthKey}</p>}
                  <div className="tl-item grid grid-cols-[64px_minmax(0,1fr)]" style={{ animationDelay: `${Math.min(index, 12) * 0.03}s` }}>
                    <div className="flex justify-center pt-[14px]">
                      <span
                        ref={(el) => {
                          if (el) dotRefs.current.set(entry.id, el);
                        }}
                        aria-hidden
                        className="relative z-10 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full p-[2px] text-sm font-medium text-white ring-4 ring-white dark:ring-[#17121f]"
                        style={{ backgroundColor: color, transform: lane ? `translateX(${-lane}px)` : undefined }}
                      >
                        {entry.avatarDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={entry.avatarDataUrl} alt="" className="block h-full w-full rounded-full object-cover" />
                        ) : (
                          entry.personName.charAt(0).toUpperCase()
                        )}
                      </span>
                    </div>
                    <Link
                      href={`/app/pessoas/${entry.personId}`}
                      className="mb-3 block rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:border-violet-300 dark:border-violet-950 dark:bg-[#1d1728] dark:hover:border-violet-800"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-violet-950 dark:text-violet-100">{entry.personName}</span>
                        {status !== "undefined" && (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass[status] ?? statusBadgeClass.ended}`}>
                            {eventStatusLabels[status] ?? entry.status}
                          </span>
                        )}
                        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{formatEventDate(entry.date, entry.datePrecision)}</span>
                      </div>
                      {entry.title && <p className="mt-1.5 text-sm font-medium text-violet-800 dark:text-violet-200">{entry.title}</p>}
                      {(outcome || emotionalTone) && (
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          {outcome && <span>Resultado: {outcomeLabels[outcome]}</span>}
                          {emotionalTone && <span>Tom: {emotionalToneLabels[emotionalTone]}</span>}
                        </div>
                      )}
                      {entry.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {entry.tags.map((tag) => (
                            <span key={tag.id} className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs text-violet-900 dark:bg-violet-950/50 dark:text-violet-200">
                              <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: tag.color }} />
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
