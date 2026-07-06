import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventTags, people, tags, timelineEvents } from "@/lib/db/schema";
import { PersonDetail } from "./person-detail";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();
  const person = db.select().from(people).where(eq(people.id, numericId)).get();
  if (!person) notFound();
  const events = await db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.personId, numericId))
    .orderBy(desc(timelineEvents.date), desc(timelineEvents.id));
  const links = events.length
    ? await db.select().from(eventTags).where(inArray(eventTags.eventId, events.map((event) => event.id)))
    : [];
  const allTags = await db.select({ id: tags.id, name: tags.name, color: tags.color }).from(tags).orderBy(asc(tags.name));
  const eventsWithTags = events.map((event) => ({
    id: event.id,
    date: event.date,
    datePrecision: event.datePrecision,
    status: event.status,
    note: event.note,
    tagIds: links.filter((link) => link.eventId === event.id).map((link) => link.tagId),
  }));
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/pessoas" className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">← Pessoas</Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-violet-950 dark:text-violet-100">{person.name}</h1>
      <div className="mt-8">
        <PersonDetail person={{ id: person.id, name: person.name, origin: person.origin }} events={eventsWithTags} allTags={allTags} />
      </div>
    </div>
  );
}
