import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { people } from "@/lib/db/schema";
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
  const [person] = await db.update(people).set({ ...parsed.data, updatedAt: new Date() }).where(eq(people.id, id)).returning();
  if (!person) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
  return NextResponse.json({ id: person.id });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const id = await resolveId(params);
  if (!id) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
  const deleted = await db.delete(people).where(eq(people.id, id)).returning();
  if (deleted.length === 0) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
