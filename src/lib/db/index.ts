import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const databasePath = process.env.DATABASE_URL ?? "./data/linha-afetiva.db";
const absolutePath = path.resolve(process.cwd(), databasePath);
fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
const client = new Database(absolutePath);
client.pragma("journal_mode = WAL");
client.pragma("foreign_keys = ON");
export const db = drizzle(client, { schema });
