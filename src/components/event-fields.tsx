"use client";
import { datePrecisionLabels, datePrecisions, eventStatusLabels, eventStatuses } from "@/lib/validation/event";

export type TagOption = { id: number; name: string; color: string };

export type EventDefaults = {
  date: Date;
  datePrecision: string;
  status: string;
  note: string | null;
};

export const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";
export const inputClass =
  "mt-2 w-full rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-violet-900 dark:bg-violet-950/30 dark:focus:border-violet-500 dark:focus:ring-violet-950";

export const toDateInput = (date: Date | null | undefined) => (date ? date.toISOString().slice(0, 10) : "");

// Reads the fields rendered by EventFields out of a submitted form.
export function collectEventPayload(form: FormData) {
  return {
    date: form.get("date"),
    datePrecision: form.get("datePrecision"),
    status: form.get("status"),
    note: form.get("note") ?? "",
    tagIds: form.getAll("tags").map(Number),
  };
}

export function EventFields({ event, allTags, selectedTagIds = [] }: { event?: EventDefaults; allTags: TagOption[]; selectedTagIds?: number[] }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-3">
        <label className={labelClass}>
          Data
          <input name="date" type="date" required defaultValue={toDateInput(event?.date)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Precisão
          <select name="datePrecision" defaultValue={event?.datePrecision ?? "day"} className={inputClass}>
            {datePrecisions.map((value) => (
              <option key={value} value={value}>
                {datePrecisionLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Situação
          <select name="status" defaultValue={event?.status ?? "active"} className={inputClass}>
            {eventStatuses.map((value) => (
              <option key={value} value={value}>
                {eventStatusLabels[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {allTags.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <label key={tag.id} className="cursor-pointer">
                <input type="checkbox" name="tags" value={tag.id} defaultChecked={selectedTagIds.includes(tag.id)} className="peer sr-only" />
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 px-3 py-1.5 text-sm text-slate-600 transition peer-checked:border-violet-400 peer-checked:bg-violet-50 peer-checked:text-violet-900 dark:border-violet-900 dark:text-slate-400 dark:peer-checked:border-violet-500 dark:peer-checked:bg-violet-950/50 dark:peer-checked:text-violet-100">
                  <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <label className={labelClass}>
        Nota
        <textarea name="note" rows={3} defaultValue={event?.note ?? ""} placeholder="Opcional" className={inputClass} />
      </label>
    </>
  );
}
