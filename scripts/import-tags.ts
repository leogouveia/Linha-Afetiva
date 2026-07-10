// Bulk upsert of tags from a semicolon-delimited CSV taxonomy (tag;label;scope;category;description).
// Idempotent and safe to re-run: a tag is matched by (normalized) name. For an existing tag, scope
// is unioned — never downgraded, so a tag already used as "relationship" gains "event" as "both"
// instead of losing its relationship use — and label/category/description are only filled in when
// currently empty, so manual edits in the tag manager are never overwritten. color is left untouched
// for existing tags.
//
// Usage:
//   npm run db:import-tags
//   npm run db:import-tags -- scripts/data/other-taxonomy.csv
import { readFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { tags } from "../src/lib/db/schema";
import { tagColors, tagScopes, type TagScope } from "../src/lib/validation/tag";

const DEFAULT_CSV = path.join(process.cwd(), "scripts", "data", "event-tags.csv");

type Row = { name: string; label: string; scope: TagScope; category: string; description: string };

function normalizeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function parseRow(line: string, lineNumber: number): Row {
  const parts = line.split(";");
  if (parts.length < 5) throw new Error(`Linha ${lineNumber}: esperado 5 campos separados por ";", encontrado ${parts.length}.`);
  const [tag, label, scope, category, ...rest] = parts;
  const trimmedScope = scope.trim();
  if (!tagScopes.includes(trimmedScope as TagScope)) throw new Error(`Linha ${lineNumber}: escopo inválido "${trimmedScope}".`);
  return {
    name: normalizeName(tag),
    label: label.trim(),
    scope: trimmedScope as TagScope,
    category: category.trim(),
    // Rejoined in case a stray ";" ends up inside the free-text description.
    description: rest.join(";").trim(),
  };
}

function loadRows(csvPath: string): Row[] {
  const content = readFileSync(csvPath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  if (lines.length === 0) throw new Error(`Arquivo vazio: ${csvPath}`);

  const [, ...dataLines] = lines; // first line is the header
  return dataLines.map((line, i) => parseRow(line, i + 2));
}

// "both" always wins; "relationship" + "event" also becomes "both" instead of picking a side.
function mergeScope(current: TagScope, incoming: TagScope): TagScope {
  if (current === incoming || current === "both") return current;
  return "both";
}

function run() {
  const csvPath = path.resolve(process.argv[2] ?? DEFAULT_CSV);
  const rows = loadRows(csvPath);
  let created = 0;
  let merged = 0;
  let colorIndex = 0;

  for (const row of rows) {
    const [existing] = db.select().from(tags).where(eq(tags.name, row.name)).all();

    if (!existing) {
      db.insert(tags)
        .values({
          name: row.name,
          label: row.label || null,
          scope: row.scope,
          category: row.category || null,
          description: row.description || null,
          color: tagColors[colorIndex % tagColors.length],
        })
        .run();
      colorIndex++;
      created++;
      continue;
    }

    db.update(tags)
      .set({
        scope: mergeScope(existing.scope as TagScope, row.scope),
        label: existing.label ?? (row.label || null),
        category: existing.category ?? (row.category || null),
        description: existing.description ?? (row.description || null),
        updatedAt: new Date(),
      })
      .where(eq(tags.id, existing.id))
      .run();
    merged++;
  }

  console.log(`${created} tag(s) criada(s), ${merged} tag(s) já existente(s) mesclada(s).`);
}

run();
