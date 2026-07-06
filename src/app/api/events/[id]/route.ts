import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { eventTags, timelineEvents } from "@/lib/db/schema";
import { eventFieldsSchema } from "@/lib/validation/event";

async function resolveId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const id = await resolveId(params);
  if (!id) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
  const parsed = eventFieldsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  const data = parsed.data;
  try {
    const event = db.transaction((tx) => {
      const updated = tx
        .update(timelineEvents)
        .set({ date: data.date, datePrecision: data.datePrecision, status: data.status, note: data.note ?? null, updatedAt: new Date() })
        .where(eq(timelineEvents.id, id))
        .returning()
        .get();
      if (!updated) return null;
      tx.delete(eventTags).where(eq(eventTags.eventId, id)).run();
      if (data.tagIds.length > 0)
        tx.insert(eventTags).values(data.tagIds.map((tagId) => ({ eventId: id, tagId }))).run();
      return updated;
    });
    if (!event) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    return NextResponse.json({ id: event.id });
  } catch (error) {
    if (error instanceof Error && "code" in error && String(error.code).startsWith("SQLITE_CONSTRAINT"))
      return NextResponse.json({ error: "Uma das tags selecionadas não existe mais." }, { status: 400 });
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const id = await resolveId(params);
  if (!id) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
  const deleted = await db.delete(timelineEvents).where(eq(timelineEvents.id, id)).returning();
  if (deleted.length === 0) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
