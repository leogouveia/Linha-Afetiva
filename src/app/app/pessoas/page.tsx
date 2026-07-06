import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { statusBadgeClass } from "@/components/status-badge";
import { formatEventDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { eventTags, people, tags, timelineEvents } from "@/lib/db/schema";
import { eventStatusLabels, type EventStatus } from "@/lib/validation/event";

type LatestEvent = { id: number; date: Date; datePrecision: string; status: string; tags: { name: string; color: string }[] };

export default async function PeoplePage() {
  const rows = await db.select().from(people);
  const events = await db
    .select({ id: timelineEvents.id, personId: timelineEvents.personId, date: timelineEvents.date, datePrecision: timelineEvents.datePrecision, status: timelineEvents.status })
    .from(timelineEvents)
    .orderBy(desc(timelineEvents.date), desc(timelineEvents.id));
  const links = await db
    .select({ eventId: eventTags.eventId, name: tags.name, color: tags.color })
    .from(eventTags)
    .innerJoin(tags, eq(eventTags.tagId, tags.id));

  const latestByPerson = new Map<number, LatestEvent>();
  const countByPerson = new Map<number, number>();
  for (const event of events) {
    countByPerson.set(event.personId, (countByPerson.get(event.personId) ?? 0) + 1);
    if (!latestByPerson.has(event.personId))
      latestByPerson.set(event.personId, { ...event, tags: links.filter((link) => link.eventId === event.id).map((link) => ({ name: link.name, color: link.color })) });
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
            const status = (latest?.status ?? "ended") as EventStatus;
            const eventCount = countByPerson.get(person.id) ?? 0;
            return (
              <li key={person.id}>
                <Link
                  href={`/app/pessoas/${person.id}`}
                  className="block rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition hover:border-violet-300 dark:border-violet-950 dark:bg-[#1d1728] dark:hover:border-violet-800"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-violet-950 dark:text-violet-100">{person.name}</span>
                    {latest && (
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass[status] ?? statusBadgeClass.ended}`}>
                        {eventStatusLabels[status] ?? latest.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {person.origin}
                    {latest ? ` · ${formatEventDate(latest.date, latest.datePrecision)}` : ""}
                    {eventCount > 1 ? ` · ${eventCount} registros` : ""}
                  </p>
                  {latest && latest.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {latest.tags.map((tag) => (
                        <span key={tag.name} className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs text-violet-900 dark:bg-violet-950/50 dark:text-violet-200">
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
