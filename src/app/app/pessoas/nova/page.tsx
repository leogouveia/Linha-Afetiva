import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { PersonForm } from "../person-form";

export default async function NewPersonPage() {
  const allTags = await db.select({ id: tags.id, name: tags.name, color: tags.color }).from(tags).orderBy(asc(tags.name));
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/pessoas" className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">← Pessoas</Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-violet-950 dark:text-violet-100">Nova pessoa</h1>
      <div className="mt-8">
        <PersonForm allTags={allTags} />
      </div>
    </div>
  );
}
