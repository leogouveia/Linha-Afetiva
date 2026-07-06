import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "../src/lib/db";
import { seedInitialTags } from "./seed";
migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrações aplicadas com sucesso.");
seedInitialTags();
