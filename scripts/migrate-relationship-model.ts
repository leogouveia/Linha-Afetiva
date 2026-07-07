// One-time backfill for the person/event tag-scope split (see README "Modelo de dados").
// Idempotent: skips entirely if person_tags already has rows.
//
// 1. Classifies every existing tag as scope "relationship" | "event" | "both", based on lists
//    the user provided when the split was requested. Tags not mentioned in either list default
//    to "both" (already the column default) since their scope can't be inferred safely.
// 2. Seeds personTags from each person's most recent event's tags, just to preserve today's
//    at-a-glance behavior — a starting point, not a final classification. May include tags that
//    were classified "event"-scope; the user can clean this up later from the person screen.
// 3. Seeds people.currentStatus from each person's most recent event's status.
import { desc, eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { eventTags, people, personTags, tags, timelineEvents } from "../src/lib/db/schema";

const RELATIONSHIP_SCOPE_TAGS = [
  "potencial-relacionamento",
  "indisponivel-emocionalmente",
  "indisponibilidade",
  "forte-interesse",
  "interesse-unilateral",
  "compatibilidade-sem-disponibilidade",
  "inseguranca",
  "relacionamento",
  "ex-significativo",
  "forte-quimica",
  "baixa-iniciativa",
  "baixa-autoestima",
  "investimento-unilateral",
  "medo-de-repeticao",
  "nao-queria-relacionamento",
  "incompatibilidade-objetivos",
  "incompatibilidade-sexual",
];

const EVENT_SCOPE_TAGS = ["primeiro-encontro", "encontro-espontaneo", "ghosting", "reapareceu", "sexual"];

function scopeFor(tagName: string): "relationship" | "event" | "both" {
  if (RELATIONSHIP_SCOPE_TAGS.includes(tagName)) return "relationship";
  if (EVENT_SCOPE_TAGS.includes(tagName)) return "event";
  return "both";
}

async function run() {
  const alreadyMigrated = db.select({ personId: personTags.personId }).from(personTags).limit(1).all().length > 0;
  if (alreadyMigrated) {
    console.log("person_tags já populada — migração já aplicada, nada a fazer.");
    return;
  }

  const allTags = db.select({ id: tags.id, name: tags.name }).from(tags).all();
  for (const tag of allTags) {
    db.update(tags).set({ scope: scopeFor(tag.name) }).where(eq(tags.id, tag.id)).run();
  }
  console.log(`${allTags.length} tag(s) classificada(s) por escopo.`);

  const events = db
    .select({ id: timelineEvents.id, personId: timelineEvents.personId, status: timelineEvents.status })
    .from(timelineEvents)
    .orderBy(desc(timelineEvents.date), desc(timelineEvents.id))
    .all();
  const links = db.select({ eventId: eventTags.eventId, tagId: eventTags.tagId }).from(eventTags).all();

  const latestEventByPerson = new Map<number, { id: number; status: string }>();
  for (const event of events) {
    if (!latestEventByPerson.has(event.personId)) latestEventByPerson.set(event.personId, { id: event.id, status: event.status });
  }

  let personTagsInserted = 0;
  let statusesUpdated = 0;
  for (const [personId, latest] of latestEventByPerson) {
    const tagIds = links.filter((link) => link.eventId === latest.id).map((link) => link.tagId);
    for (const tagId of tagIds) {
      db.insert(personTags).values({ personId, tagId }).run();
      personTagsInserted++;
    }
    db.update(people).set({ currentStatus: latest.status }).where(eq(people.id, personId)).run();
    statusesUpdated++;
  }

  console.log(`${personTagsInserted} vínculo(s) de tag-pessoa criado(s) a partir do registro mais recente de cada pessoa.`);
  console.log(`${statusesUpdated} pessoa(s) com currentStatus preenchido a partir do registro mais recente.`);
}

run();
