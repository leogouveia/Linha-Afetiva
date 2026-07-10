import { asc, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventTags, personTags, tags } from "@/lib/db/schema";
import { TagManager } from "./tag-manager";

export default async function TagsPage() {
  const [tagRows, eventCounts, personCounts] = await Promise.all([
    db
      .select({ id: tags.id, name: tags.name, label: tags.label, scope: tags.scope, color: tags.color, category: tags.category, description: tags.description })
      .from(tags)
      .orderBy(asc(tags.name)),
    db.select({ tagId: eventTags.tagId, n: count() }).from(eventTags).groupBy(eventTags.tagId),
    db.select({ tagId: personTags.tagId, n: count() }).from(personTags).groupBy(personTags.tagId),
  ]);
  const eventUsesByTag = new Map(eventCounts.map((row) => [row.tagId, row.n]));
  const personUsesByTag = new Map(personCounts.map((row) => [row.tagId, row.n]));
  const rows = tagRows.map((tag) => ({ ...tag, eventUses: eventUsesByTag.get(tag.id) ?? 0, personUses: personUsesByTag.get(tag.id) ?? 0 }));
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Organização</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-violet-950 dark:text-violet-100">Tags</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">Crie tags com cor para classificar as pessoas da sua linha afetiva.</p>
      <div className="mt-8">
        <TagManager tags={rows} />
      </div>
    </div>
  );
}
