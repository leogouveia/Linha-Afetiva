import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { eventTags, people, timelineEvents } from "@/lib/db/schema";
import { personCreateSchema } from "@/lib/validation/person";

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const parsed = personCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  const data = parsed.data;
  try {
    const person = db.transaction((tx) => {
      const created = tx.insert(people).values({ name: data.name, origin: data.origin }).returning().get();
      const event = tx
        .insert(timelineEvents)
        .values({ personId: created.id, date: data.date, datePrecision: data.datePrecision, status: data.status, note: data.note ?? null })
        .returning()
        .get();
      if (data.tagIds.length > 0)
        tx.insert(eventTags).values(data.tagIds.map((tagId) => ({ eventId: event.id, tagId }))).run();
      return created;
    });
    return NextResponse.json({ id: person.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && String(error.code).startsWith("SQLITE_CONSTRAINT"))
      return NextResponse.json({ error: "Uma das tags selecionadas não existe mais." }, { status: 400 });
    throw error;
  }
}
