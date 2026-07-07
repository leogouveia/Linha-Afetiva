import Link from "next/link";
import { loadTagOptions } from "@/lib/tags";
import { PersonForm } from "../person-form";

export default async function NewPersonPage() {
  const allTags = await loadTagOptions();
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
