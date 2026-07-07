import { asc, count, desc, inArray } from "drizzle-orm";
import { StatBlock } from "@/components/stat-block";
import { toAvatarDataUrl } from "@/lib/avatar";
import { db } from "@/lib/db";
import { eventTags, people, personTags, timelineEvents } from "@/lib/db/schema";
import { countBy } from "@/lib/stats";
import { loadTagOptions } from "@/lib/tags";
import { eventStatusLabels, eventTypeLabels, outcomeLabels, type EventStatus, type EventType, type Outcome } from "@/lib/validation/event";
import { Timeline, type TimelineEntry } from "./timeline";

export default async function DashboardPage() {
  const [peopleRows, eventRows, allTags] = await Promise.all([
    db.select({ id: people.id, name: people.name, avatar: people.avatar, avatarType: people.avatarType, currentStatus: people.currentStatus }).from(people).orderBy(asc(people.name)),
    db.select().from(timelineEvents).orderBy(desc(timelineEvents.date), desc(timelineEvents.id)),
    loadTagOptions(),
  ]);
  const tagById = new Map(allTags.map((tag) => [tag.id, tag]));
  const personById = new Map(peopleRows.map((person) => [person.id, person]));
  const [eventTagLinks, relationshipTagLinks] = await Promise.all([
    eventRows.length
      ? db.select({ eventId: eventTags.eventId, tagId: eventTags.tagId }).from(eventTags).where(inArray(eventTags.eventId, eventRows.map((event) => event.id)))
      : Promise.resolve([]),
    db.select({ tagId: personTags.tagId }).from(personTags),
  ]);

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

  const relationshipTagStats = countBy(relationshipTagLinks, (link) => tagById.get(link.tagId)?.name ?? null);
  const eventTagStats = countBy(eventTagLinks, (link) => tagById.get(link.tagId)?.name ?? null);
  const outcomeStats = countBy(eventRows, (event) => (event.outcome ? outcomeLabels[event.outcome as Outcome] : null));
  const eventTypeStats = countBy(eventRows, (event) => (event.eventType ? eventTypeLabels[event.eventType as EventType] : null));
  const statusStats = countBy(peopleRows, (person) => eventStatusLabels[person.currentStatus as EventStatus] ?? null);

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
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-violet-950 dark:text-violet-100">Padrões</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatBlock title="Tags de relação mais frequentes" items={relationshipTagStats} emptyLabel="Nenhuma tag de relação ainda." />
            <StatBlock title="Tags de evento mais frequentes" items={eventTagStats} emptyLabel="Nenhuma tag de evento ainda." />
            <StatBlock title="Status atual das pessoas" items={statusStats} emptyLabel="Sem dados." />
            <StatBlock title="Resultados dos eventos" items={outcomeStats} emptyLabel="Nenhum resultado informado ainda." />
            <StatBlock title="Tipos de evento" items={eventTypeStats} emptyLabel="Nenhum tipo informado ainda." />
          </div>
        </div>
      )}
    </>
  );
}
