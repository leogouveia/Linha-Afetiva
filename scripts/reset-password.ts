import { input, password as passwordPrompt } from "@inquirer/prompts";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { loginSchema } from "../src/lib/validation/auth";

async function main() {
  const email = (process.argv[2] ?? (await input({ message: "Email:" })))
    .trim()
    .toLowerCase();
  const password = process.argv[3] ?? (await passwordPrompt({ message: "Nova senha:" }));
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success || password.length < 8)
    throw new Error(
      parsed.success
        ? "A senha deve ter pelo menos 8 caracteres."
        : parsed.error.issues[0]?.message,
    );
  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) throw new Error("Nenhum usuário com este email. Use npm run user:create.");
  db.update(users)
    .set({ passwordHash: await hash(password), updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .run();
  console.log(`Senha de ${email} atualizada com sucesso.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
