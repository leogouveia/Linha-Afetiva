import { asc, count, desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { toAvatarDataUrl } from "@/lib/avatar";
import { db } from "@/lib/db";
import { eventTags, people, timelineEvents } from "@/lib/db/schema";
import { loadTagOptions } from "@/lib/tags";
import { Timeline, type TimelineEntry } from "./timeline";

export default async function DashboardPage() {
  const [peopleRows, eventRows, allTags] = await Promise.all([
    db.select({ id: people.id, name: people.name, avatar: people.avatar, avatarType: people.avatarType, currentStatus: people.currentStatus }).from(people).orderBy(asc(people.name)),
    db.select().from(timelineEvents).orderBy(desc(timelineEvents.date), desc(timelineEvents.id)),
    loadTagOptions(),
  ]);
  const tagById = new Map(allTags.map((tag) => [tag.id, tag]));
  const personById = new Map(peopleRows.map((person) => [person.id, person]));
  const eventTagLinks = eventRows.length
    ? await db.select({ eventId: eventTags.eventId, tagId: eventTags.tagId }).from(eventTags).where(inArray(eventTags.eventId, eventRows.map((event) => event.id)))
    : [];

  const entries: TimelineEntry[] = eventRows
    .filter((event) => personById.has(event.personId))
    .map((event) => {
      const person = personById.get(event.personId)!;
      return {
        id: event.id,
        personId: event.personId,
        personName: person.name,
        avatarDataUrl: toAvatarDataUrl(person.avatar, person.avatarType),
        date: event.date,
        datePrecision: event.datePrecision,
        status: event.status,
        title: event.title,
        outcome: event.outcome,
        emotionalTone: event.emotionalTone,
        tags: eventTagLinks
          .filter((link) => link.eventId === event.id)
          .map((link) => tagById.get(link.tagId))
          .filter((tag) => tag !== undefined),
      };
    });

  const [totalPeople] = await db.select({ value: count() }).from(people);

  return (
    <>
      <div>
        <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Visão geral</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-violet-950 dark:text-violet-100">Sua linha afetiva</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {totalPeople.value} {totalPeople.value === 1 ? "pessoa" : "pessoas"} · {eventRows.length} {eventRows.length === 1 ? "registro" : "registros"}
        </p>
      </div>
      <div className="mt-6">
        <Timeline entries={entries} people={peopleRows.map((person) => ({ id: person.id, name: person.name }))} allTags={allTags} />
      </div>
      {entries.length > 0 && (
        <Link
          href="/app/estatisticas"
          className="mt-10 flex items-center justify-between rounded-2xl border border-violet-100 bg-white p-5 text-sm font-medium text-violet-700 shadow-sm transition hover:border-violet-300 dark:border-violet-950 dark:bg-[#1d1728] dark:text-violet-300 dark:hover:border-violet-800"
        >
          Ver estatísticas completas
          <span aria-hidden>→</span>
        </Link>
      )}
    </>
  );
}
