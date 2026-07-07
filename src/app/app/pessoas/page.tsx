import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { statusBadgeClass } from "@/components/status-badge";
import { toAvatarDataUrl } from "@/lib/avatar";
import { getPersonColor } from "@/lib/colors";
import { formatEventDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { people, personTags, timelineEvents } from "@/lib/db/schema";
import { loadTagOptions } from "@/lib/tags";
import { eventStatusLabels, type EventStatus } from "@/lib/validation/event";

type LatestEvent = { date: Date; datePrecision: string };

export default async function PeoplePage() {
  const rows = await db.select().from(people);
  const events = await db
    .select({ id: timelineEvents.id, personId: timelineEvents.personId, date: timelineEvents.date, datePrecision: timelineEvents.datePrecision })
    .from(timelineEvents)
    .orderBy(desc(timelineEvents.date), desc(timelineEvents.id));
  const allTags = await loadTagOptions();
  const tagById = new Map(allTags.map((tag) => [tag.id, tag]));
  const relationshipLinks = rows.length
    ? await db.select({ personId: personTags.personId, tagId: personTags.tagId }).from(personTags).where(inArray(personTags.personId, rows.map((person) => person.id)))
    : [];

  const latestByPerson = new Map<number, LatestEvent>();
  const countByPerson = new Map<number, number>();
  for (const event of events) {
    countByPerson.set(event.personId, (countByPerson.get(event.personId) ?? 0) + 1);
    if (!latestByPerson.has(event.personId)) latestByPerson.set(event.personId, { date: event.date, datePrecision: event.datePrecision });
  }
  const sorted = [...rows].sort((a, b) => (latestByPerson.get(b.id)?.date.getTime() ?? 0) - (latestByPerson.get(a.id)?.date.getTime() ?? 0));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Registros</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-violet-950 dark:text-violet-100">Pessoas</h1>
        </div>
        <Link href="/app/pessoas/nova" className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-800">
          Nova pessoa
        </Link>
      </div>
      {sorted.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-violet-200 p-10 text-center text-slate-500 dark:border-violet-900 dark:text-slate-400">
          Nenhuma pessoa registrada ainda. Comece adicionando a primeira.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {sorted.map((person) => {
            const latest = latestByPerson.get(person.id);
            const status = person.currentStatus as EventStatus;
            const eventCount = countByPerson.get(person.id) ?? 0;
            const relationshipTags = relationshipLinks
              .filter((link) => link.personId === person.id)
              .map((link) => tagById.get(link.tagId))
              .filter((tag) => tag !== undefined);
            return (
              <li key={person.id}>
                <Link
                  href={`/app/pessoas/${person.id}`}
                  className="block rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition hover:border-violet-300 dark:border-violet-950 dark:bg-[#1d1728] dark:hover:border-violet-800"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-3">
                      <span
                        className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: getPersonColor(person.id) }}
                        aria-hidden
                      >
                        {person.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={toAvatarDataUrl(person.avatar, person.avatarType)!} alt="" className="h-full w-full object-cover" />
                        ) : (
                          person.name.charAt(0).toUpperCase()
                        )}
                      </span>
                      <span className="font-medium text-violet-950 dark:text-violet-100">{person.name}</span>
                    </span>
                    {status !== "undefined" && (
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass[status] ?? statusBadgeClass.ended}`}>
                        {eventStatusLabels[status] ?? person.currentStatus}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {person.origin}
                    {latest ? ` · ${formatEventDate(latest.date, latest.datePrecision)}` : ""}
                    {eventCount > 1 ? ` · ${eventCount} registros` : ""}
                  </p>
                  {relationshipTags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {relationshipTags.map((tag) => (
                        <span key={tag.id} className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs text-violet-900 dark:bg-violet-950/50 dark:text-violet-200">
                          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
