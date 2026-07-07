import { asc, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventTags, tags } from "@/lib/db/schema";
import { TagManager } from "./tag-manager";

export default async function TagsPage() {
  const rows = await db
    .select({ id: tags.id, name: tags.name, label: tags.label, scope: tags.scope, color: tags.color, uses: count(eventTags.eventId) })
    .from(tags)
    .leftJoin(eventTags, eq(tags.id, eventTags.tagId))
    .groupBy(tags.id)
    .orderBy(asc(tags.name));
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
