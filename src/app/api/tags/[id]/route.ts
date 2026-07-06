import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { tagSchema } from "@/lib/validation/tag";

async function resolveId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const id = await resolveId(params);
  if (!id) return NextResponse.json({ error: "Tag não encontrada." }, { status: 404 });
  const parsed = tagSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  try {
    const [tag] = await db.update(tags).set(parsed.data).where(eq(tags.id, id)).returning();
    if (!tag) return NextResponse.json({ error: "Tag não encontrada." }, { status: 404 });
    return NextResponse.json({ id: tag.id });
  } catch (error) {
    if (error instanceof Error && "code" in error && String(error.code).startsWith("SQLITE_CONSTRAINT"))
      return NextResponse.json({ error: "Já existe uma tag com esse nome." }, { status: 409 });
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const id = await resolveId(params);
  if (!id) return NextResponse.json({ error: "Tag não encontrada." }, { status: 404 });
  const deleted = await db.delete(tags).where(eq(tags.id, id)).returning();
  if (deleted.length === 0) return NextResponse.json({ error: "Tag não encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
