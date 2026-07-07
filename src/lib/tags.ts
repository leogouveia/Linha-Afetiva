import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import type { TagOption } from "@/components/tag-select";
import type { TagScope } from "@/lib/validation/tag";

// Shared by every page that feeds a TagMultiSelect: resolves `label ?? name` once here so
// callers never have to remember the fallback.
export async function loadTagOptions(): Promise<TagOption[]> {
  const rows = await db.select({ id: tags.id, name: tags.name, label: tags.label, color: tags.color, scope: tags.scope }).from(tags).orderBy(asc(tags.name));
  return rows.map((tag) => ({ id: tag.id, name: tag.label ?? tag.name, color: tag.color, scope: tag.scope as TagScope }));
}
