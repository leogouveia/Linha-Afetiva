import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseAvatarDataUrl } from "@/lib/avatar";
import { db } from "@/lib/db";
import { eventTags, people, personTags, timelineEvents } from "@/lib/db/schema";
import { syncPersonStatus } from "@/lib/status-sync";
import { personCreateSchema } from "@/lib/validation/person";

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const parsed = personCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  const data = parsed.data;
  let avatarFields;
  try {
    avatarFields = parseAvatarDataUrl(data.avatar);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Foto inválida." }, { status: 400 });
  }
  try {
    const person = db.transaction((tx) => {
      const created = tx
        .insert(people)
        .values({
          name: data.name,
          origin: data.origin,
          startedAt: data.startedAt ?? null,
          endedAt: data.endedAt ?? null,
          howEnded: data.howEnded ?? null,
          generalNotes: data.generalNotes ?? null,
          ...avatarFields,
        })
        .returning()
        .get();
      const event = tx
        .insert(timelineEvents)
        .values({
          personId: created.id,
          date: data.date,
          datePrecision: data.datePrecision,
          title: data.title,
          description: data.description ?? null,
          eventType: data.eventType ?? null,
          channel: data.channel ?? null,
          locationType: data.locationType ?? null,
          emotionalTone: data.emotionalTone ?? null,
          outcome: data.outcome ?? null,
          status: data.status,
        })
        .returning()
        .get();
      if (data.tagIds.length > 0) tx.insert(eventTags).values(data.tagIds.map((tagId) => ({ eventId: event.id, tagId }))).run();
      if (data.relationshipTagIds.length > 0) tx.insert(personTags).values(data.relationshipTagIds.map((tagId) => ({ personId: created.id, tagId }))).run();
      // currentStatus isn't a field on the creation form — it's derived from the first event's
      // status, same rule as any later event (see src/lib/status-sync.ts).
      syncPersonStatus(tx, created.id, data.status);
      return created;
    });
    return NextResponse.json({ id: person.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && String(error.code).startsWith("SQLITE_CONSTRAINT"))
      return NextResponse.json({ error: "Uma das tags selecionadas não existe mais." }, { status: 400 });
    throw error;
  }
}
