import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseAvatarDataUrl } from "@/lib/avatar";
import { db } from "@/lib/db";
import { people, personTags } from "@/lib/db/schema";
import { personUpdateSchema } from "@/lib/validation/person";

async function resolveId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const id = await resolveId(params);
  if (!id) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
  const parsed = personUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  const { avatar, relationshipTagIds, ...identity } = parsed.data;
  let avatarFields;
  try {
    avatarFields = parseAvatarDataUrl(avatar);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Foto inválida." }, { status: 400 });
  }
  try {
    const person = db.transaction((tx) => {
      const updated = tx
        .update(people)
        .set({
          ...identity,
          startedAt: identity.startedAt ?? null,
          endedAt: identity.endedAt ?? null,
          howEnded: identity.howEnded ?? null,
          generalNotes: identity.generalNotes ?? null,
          ...avatarFields,
          updatedAt: new Date(),
        })
        .where(eq(people.id, id))
        .returning()
        .get();
      if (!updated) return null;
      tx.delete(personTags).where(eq(personTags.personId, id)).run();
      if (relationshipTagIds.length > 0) tx.insert(personTags).values(relationshipTagIds.map((tagId) => ({ personId: id, tagId }))).run();
      return updated;
    });
    if (!person) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    return NextResponse.json({ id: person.id });
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
  const deleted = await db.delete(people).where(eq(people.id, id)).returning();
  if (deleted.length === 0) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
