"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { collectEventPayload, EventFields, inputClass, labelClass, type TagOption } from "@/components/event-fields";
import { statusBadgeClass } from "@/components/status-badge";
import { formatEventDate } from "@/lib/dates";
import { eventStatusLabels, type EventStatus } from "@/lib/validation/event";
import { personOrigins } from "@/lib/validation/person";

export type PersonIdentity = { id: number; name: string; origin: string };
export type PersonEvent = {
  id: number;
  date: Date;
  datePrecision: string;
  status: string;
  note: string | null;
  tagIds: number[];
};

const errorClass = "rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
const primaryButtonClass = "rounded-xl bg-violet-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-800 disabled:opacity-60";
const ghostButtonClass = "rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-violet-50 dark:text-slate-400 dark:hover:bg-violet-950/60";

function EventForm({ personId, event, allTags, onDone }: { personId: number; event?: PersonEvent; allTags: TagOption[]; onDone: () => void }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError("");
    setSaving(true);
    const payload = { personId, ...collectEventPayload(new FormData(formEvent.currentTarget)) };
    const response = await fetch(event ? `/api/events/${event.id}` : "/api/events", {
      method: event ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar.");
      return;
    }
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <EventFields event={event} allTags={allTags} selectedTagIds={event?.tagIds} />
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <div className="flex gap-3">
        <button disabled={saving} className={primaryButtonClass}>{saving ? "Salvando…" : "Salvar registro"}</button>
        <button type="button" onClick={onDone} className={ghostButtonClass}>Cancelar</button>
      </div>
    </form>
  );
}

export function PersonDetail({ person, events, allTags }: { person: PersonIdentity; events: PersonEvent[]; allTags: TagOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const tagById = new Map(allTags.map((tag) => [tag.id, tag]));

  async function saveIdentity(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError("");
    setSavingIdentity(true);
    const form = new FormData(formEvent.currentTarget);
    const response = await fetch(`/api/people/${person.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), origin: form.get("origin") }),
    });
    setSavingIdentity(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar.");
      return;
    }
    router.refresh();
  }

  async function removePerson() {
    if (!window.confirm(`Excluir ${person.name} e todos os seus registros? Essa ação não pode ser desfeita.`)) return;
    setError("");
    setDeleting(true);
    const response = await fetch(`/api/people/${person.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível excluir.");
      setDeleting(false);
      return;
    }
    router.push("/app/pessoas");
    router.refresh();
  }

  async function removeEvent(event: PersonEvent) {
    if (!window.confirm(`Excluir o registro de ${formatEventDate(event.date, event.datePrecision)}?`)) return;
    setError("");
    const response = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível excluir.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <form onSubmit={saveIdentity} className="space-y-5 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm dark:border-violet-950 dark:bg-[#1d1728]">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>
            Nome
            <input name="name" required defaultValue={person.name} className={inputClass} />
          </label>
          <label className={labelClass}>
            Origem
            <select name="origin" required defaultValue={person.origin} className={inputClass}>
              {!personOrigins.includes(person.origin as (typeof personOrigins)[number]) && <option value={person.origin}>{person.origin}</option>}
              {personOrigins.map((origin) => (
                <option key={origin} value={origin}>
                  {origin}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button disabled={savingIdentity || deleting} className={primaryButtonClass}>
            {savingIdentity ? "Salvando…" : "Salvar"}
          </button>
          <button type="button" onClick={removePerson} disabled={savingIdentity || deleting} className="rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-950/40">
            {deleting ? "Excluindo…" : "Excluir pessoa"}
          </button>
        </div>
      </form>

      {error && <p role="alert" className={errorClass}>{error}</p>}

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-violet-950 dark:text-violet-100">Registros</h2>
          {!adding && (
            <button type="button" onClick={() => { setAdding(true); setEditingEventId(null); }} className={primaryButtonClass}>
              Novo registro
            </button>
          )}
        </div>
        {adding && (
          <div className="mt-4 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm dark:border-violet-950 dark:bg-[#1d1728]">
            <EventForm personId={person.id} allTags={allTags} onDone={() => setAdding(false)} />
          </div>
        )}
        <ul className="mt-4 space-y-3">
          {events.map((event) => {
            const status = event.status as EventStatus;
            return (
              <li key={event.id} className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm dark:border-violet-950 dark:bg-[#1d1728]">
                {editingEventId === event.id ? (
                  <EventForm personId={person.id} event={event} allTags={allTags} onDone={() => setEditingEventId(null)} />
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-medium text-violet-950 dark:text-violet-100">{formatEventDate(event.date, event.datePrecision)}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass[status] ?? statusBadgeClass.ended}`}>
                        {eventStatusLabels[status] ?? event.status}
                      </span>
                      <span className="ml-auto flex gap-1">
                        <button type="button" onClick={() => { setEditingEventId(event.id); setAdding(false); }} className="rounded-lg px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/60">
                          Editar
                        </button>
                        <button type="button" onClick={() => removeEvent(event)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40">
                          Excluir
                        </button>
                      </span>
                    </div>
                    {event.tagIds.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {event.tagIds.map((tagId) => {
                          const tag = tagById.get(tagId);
                          if (!tag) return null;
                          return (
                            <span key={tagId} className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs text-violet-900 dark:bg-violet-950/50 dark:text-violet-200">
                              <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: tag.color }} />
                              {tag.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {event.note && <p className="mt-3 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">{event.note}</p>}
                  </>
                )}
              </li>
            );
          })}
        </ul>
        {events.length === 0 && !adding && (
          <p className="mt-4 rounded-2xl border border-dashed border-violet-200 p-8 text-center text-slate-500 dark:border-violet-900 dark:text-slate-400">
            Nenhum registro ainda.
          </p>
        )}
      </section>
    </div>
  );
}
