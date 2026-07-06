import { asc, count, desc, eq, inArray } from "drizzle-orm";
import { toAvatarDataUrl } from "@/lib/avatar";
import { db } from "@/lib/db";
import { eventTags, people, tags, timelineEvents } from "@/lib/db/schema";
import { Timeline, type TimelineEntry } from "./timeline";

export default async function DashboardPage() {
  const [peopleRows, eventRows, allTags] = await Promise.all([
    db.select({ id: people.id, name: people.name, avatar: people.avatar, avatarType: people.avatarType }).from(people).orderBy(asc(people.name)),
    db.select().from(timelineEvents).orderBy(desc(timelineEvents.date), desc(timelineEvents.id)),
    db.select({ id: tags.id, name: tags.name, color: tags.color }).from(tags).orderBy(asc(tags.name)),
  ]);
  const personById = new Map(peopleRows.map((person) => [person.id, person]));
  const links = eventRows.length
    ? await db
        .select({ eventId: eventTags.eventId, id: tags.id, name: tags.name, color: tags.color })
        .from(eventTags)
        .innerJoin(tags, eq(eventTags.tagId, tags.id))
        .where(inArray(eventTags.eventId, eventRows.map((event) => event.id)))
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
        tags: links.filter((link) => link.eventId === event.id).map((link) => ({ id: link.id, name: link.name, color: link.color })),
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
    </>
  );
}
