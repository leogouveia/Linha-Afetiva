import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { tagSchema } from "@/lib/validation/tag";

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const parsed = tagSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  try {
    const [tag] = await db.insert(tags).values(parsed.data).returning();
    return NextResponse.json({ id: tag.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && String(error.code).startsWith("SQLITE_CONSTRAINT"))
      return NextResponse.json({ error: "Já existe uma tag com esse nome." }, { status: 409 });
    throw error;
  }
}
