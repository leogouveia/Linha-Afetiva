import { verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, SESSION_DURATION_SECONDS } from "@/lib/auth/constants";
import { createToken } from "@/lib/auth/token";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  const user = db.select().from(users).where(eq(users.email, parsed.data.email)).get();
  if (!user || !(await verify(user.passwordHash, parsed.data.password))) return NextResponse.json({ error: "Email ou senha inválidos." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, await createToken(user), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DURATION_SECONDS });
  return response;
}
