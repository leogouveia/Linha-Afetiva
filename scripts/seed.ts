// Seeds the system's initial tags when the tags table is empty (fresh install or
// wiped database). Idempotent: never touches tags the user already has.
// Runs automatically after migrations (npm run db:migrate) or standalone (npm run db:seed).
import { count } from "drizzle-orm";
import { db } from "../src/lib/db";
import { tags } from "../src/lib/db/schema";
import { tagColors } from "../src/lib/validation/tag";

const initialTags = [
  "abandono",
  "amor-reciproco",
  "arrependimento",
  "baixa-autoestima",
  "baixa-iniciativa",
  "cobranca",
  "compatibilidade-sem-disponibilidade",
  "contatinho",
  "controle",
  "criticas",
  "depressao",
  "desconforto",
  "em-andamento",
  "encontro-espontaneo",
  "ex-significativo",
  "forte-interesse",
  "forte-quimica",
  "ghosting",
  "indisponibilidade",
  "indisponivel-emocionalmente",
  "incompatibilidade-objetivos",
  "incompatibilidade-sexual",
  "inseguranca",
  "intenso",
  "interesse-unilateral",
  "investimento-unilateral",
  "longa-duracao",
  "medo-de-repeticao",
  "nao-queria-relacionamento",
  "paixao",
  "potencial-relacionamento",
  "pressao",
  "primeiro-encontro",
  "reapareceu",
  "relacionamento",
  "ritmo-lento",
  "sem-dados",
  "sexual",
  "tentativa-relacionamento",
  "timing",
  "tinder",
];

export function seedInitialTags() {
  const [existing] = db.select({ value: count() }).from(tags).all();
  if (existing.value > 0) {
    console.log(`Seed ignorado: a tabela de tags já tem ${existing.value} registro(s).`);
    return;
  }
  db.insert(tags)
    .values(initialTags.map((name, index) => ({ name, color: tagColors[index % tagColors.length] })))
    .run();
  console.log(`${initialTags.length} tags iniciais criadas.`);
}

// Run directly only when invoked as a script (npm run db:seed), not when imported.
if (process.argv[1]?.endsWith("seed.ts")) seedInitialTags();
