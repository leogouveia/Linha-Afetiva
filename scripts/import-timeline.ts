// Bulk import from a local CSV into people/tags/timelineEvents.
// Idempotent: skips a row if that person already has an event on that exact date.
//
// Usage:
//   pnpm run db:import
//   pnpm run db:import -- data/timeline-import.csv
//
// Copy data/timeline-import.example.csv to data/timeline-import.csv and fill in your rows.
// The CSV file is gitignored — never commit personal data.
import { readFileSync } from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { eventTags, people, tags, timelineEvents } from "../src/lib/db/schema";
import { tagColors } from "../src/lib/validation/tag";

type DatePrecision = "day" | "approx";

type Row = {
  date: string;
  precision: DatePrecision;
  name: string;
  origin: string;
  tagNames: string[];
  note: string;
};

const DEFAULT_CSV = path.join(process.cwd(), "data", "timeline-import.csv");

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  fields.push(current);
  return fields;
}

function loadRows(csvPath: string): Row[] {
  const content = readFileSync(csvPath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length === 0) throw new Error(`Arquivo vazio: ${csvPath}`);

  const [headerLine, ...dataLines] = lines;
  const headers = parseCsvLine(headerLine).map((header) => header.trim().toLowerCase());
  const required = ["date", "precision", "name", "origin", "tags", "note"];
  for (const column of required) {
    if (!headers.includes(column)) throw new Error(`Coluna obrigatória ausente no CSV: ${column}`);
  }

  const index = Object.fromEntries(headers.map((header, i) => [header, i]));

  return dataLines.map((line, lineNumber) => {
    const values = parseCsvLine(line);
    const get = (column: string) => values[index[column]]?.trim() ?? "";
    const precision = get("precision");
    if (precision !== "day" && precision !== "approx") {
      throw new Error(`Linha ${lineNumber + 2}: precision deve ser "day" ou "approx".`);
    }

    const tagNames = get("tags")
      .split("|")
      .map((tag) => tag.trim())
      .filter(Boolean);

    return {
      date: get("date"),
      precision,
      name: get("name"),
      origin: get("origin"),
      tagNames,
      note: get("note"),
    };
  });
}

function parseDate(value: string): Date {
  const [day, month, year] = value.split("/").map(Number);
  if (!day || !month || !year) throw new Error(`Data inválida: ${value} (use dd/mm/yyyy)`);
  return new Date(year, month - 1, day);
}

async function tagIdFor(name: string, cache: Map<string, number>): Promise<number> {
  const cached = cache.get(name);
  if (cached) return cached;

  const [existing] = db.select({ id: tags.id }).from(tags).where(eq(tags.name, name)).all();
  if (existing) {
    cache.set(name, existing.id);
    return existing.id;
  }

  const color = tagColors[cache.size % tagColors.length];
  const [created] = db.insert(tags).values({ name, color }).returning({ id: tags.id }).all();
  cache.set(name, created.id);
  console.log(`Tag criada: ${name}`);
  return created.id;
}

async function run() {
  const csvPath = path.resolve(process.argv[2] ?? DEFAULT_CSV);
  const rows = loadRows(csvPath);
  const tagCache = new Map<string, number>();
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const date = parseDate(row.date);

    let [person] = db.select().from(people).where(eq(people.name, row.name)).all();
    if (!person) {
      [person] = db.insert(people).values({ name: row.name, origin: row.origin }).returning().all();
      console.log(`Pessoa criada: ${row.name}`);
    }

    const [existingEvent] = db
      .select({ id: timelineEvents.id })
      .from(timelineEvents)
      .where(and(eq(timelineEvents.personId, person.id), eq(timelineEvents.date, date)))
      .all();
    if (existingEvent) {
      skipped++;
      continue;
    }

    const [event] = db
      .insert(timelineEvents)
      .values({ personId: person.id, date, datePrecision: row.precision, status: "ended", description: row.note })
      .returning()
      .all();

    for (const tagName of row.tagNames) {
      const tagId = await tagIdFor(tagName, tagCache);
      db.insert(eventTags).values({ eventId: event.id, tagId }).run();
    }

    imported++;
  }

  console.log(`${imported} registro(s) importado(s), ${skipped} ignorado(s) (já existentes).`);
}

run();
