import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { loginSchema } from "../src/lib/validation/auth";

async function main() {
  const io = createInterface({ input: stdin, output: stdout });
  try {
    const email = (process.argv[2] ?? (await io.question("Email: ")))
      .trim()
      .toLowerCase();
    const password = process.argv[3] ?? (await io.question("Senha: "));
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success || password.length < 8)
      throw new Error(
        parsed.success
          ? "A senha deve ter pelo menos 8 caracteres."
          : parsed.error.issues[0]?.message,
      );
    if (db.select().from(users).where(eq(users.email, email)).get())
      throw new Error("Já existe um usuário com este email.");
    const now = new Date();
    db.insert(users)
      .values({
        email,
        passwordHash: await hash(password),
        createdAt: now,
        updatedAt: now,
      })
      .run();
    console.log(`Usuário ${email} criado com sucesso.`);
  } finally {
    io.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
