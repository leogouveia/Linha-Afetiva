"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { collectEventPayload, EventFields, inputClass, labelClass, type TagOption } from "@/components/event-fields";
import { personOrigins } from "@/lib/validation/person";

export function PersonForm({ allTags }: { allTags: TagOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      origin: form.get("origin"),
      ...collectEventPayload(form),
    };
    const response = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar.");
      setSaving(false);
      return;
    }
    // Keep the button disabled while navigating away, so a second click can't duplicate the record.
    router.push("/app/pessoas");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className={labelClass}>
        Nome
        <input name="name" required className={inputClass} />
      </label>
      <label className={labelClass}>
        Origem
        <select name="origin" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Onde/como se conheceram
          </option>
          {personOrigins.map((origin) => (
            <option key={origin} value={origin}>
              {origin}
            </option>
          ))}
        </select>
      </label>
      <EventFields allTags={allTags} />
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
      <button disabled={saving} className="rounded-xl bg-violet-700 px-6 py-3 font-medium text-white transition hover:bg-violet-800 disabled:opacity-60">
        {saving ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
