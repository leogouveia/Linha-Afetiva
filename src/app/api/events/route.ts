import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { eventTags, people, timelineEvents } from "@/lib/db/schema";
import { eventSchema } from "@/lib/validation/event";

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  const data = parsed.data;
  const person = db.select({ id: people.id }).from(people).where(eq(people.id, data.personId)).get();
  if (!person) return NextResponse.json({ error: "Pessoa não encontrada." }, { status: 404 });
  try {
    const event = db.transaction((tx) => {
      const created = tx
        .insert(timelineEvents)
        .values({ personId: data.personId, date: data.date, datePrecision: data.datePrecision, status: data.status, note: data.note ?? null })
        .returning()
        .get();
      if (data.tagIds.length > 0)
        tx.insert(eventTags).values(data.tagIds.map((tagId) => ({ eventId: created.id, tagId }))).run();
      return created;
    });
    return NextResponse.json({ id: event.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && String(error.code).startsWith("SQLITE_CONSTRAINT"))
      return NextResponse.json({ error: "Uma das tags selecionadas não existe mais." }, { status: 400 });
    throw error;
  }
}
