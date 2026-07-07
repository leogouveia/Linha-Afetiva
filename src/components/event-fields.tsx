"use client";
import { useState } from "react";
import {
  channelLabels,
  channels,
  datePrecisionLabels,
  datePrecisions,
  emotionalToneLabels,
  emotionalTones,
  eventStatusLabels,
  eventStatuses,
  eventTypeLabels,
  eventTypes,
  locationTypeLabels,
  locationTypes,
  outcomeLabels,
  outcomes,
} from "@/lib/validation/event";
import { eventScopeTags, TagMultiSelect, type TagOption } from "@/components/tag-select";

export type { TagOption };

export type EventDefaults = {
  date: Date;
  datePrecision: string;
  title: string | null;
  description: string | null;
  eventType: string | null;
  channel: string | null;
  locationType: string | null;
  emotionalTone: string | null;
  outcome: string | null;
  status: string;
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
    title: form.get("title"),
    description: form.get("description") ?? "",
    eventType: form.get("eventType") ?? "",
    channel: form.get("channel") ?? "",
    locationType: form.get("locationType") ?? "",
    emotionalTone: form.get("emotionalTone") ?? "",
    outcome: form.get("outcome") ?? "",
    status: form.get("status"),
    tagIds: form.getAll("tags").map(Number),
  };
}

export function EventFields({ event, allTags, selectedTagIds = [] }: { event?: EventDefaults; allTags: TagOption[]; selectedTagIds?: number[] }) {
  const [tagIds, setTagIds] = useState(selectedTagIds);
  const dropdownOptions = eventScopeTags(allTags);
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
          Status depois do evento
          <select name="status" defaultValue={event?.status ?? "undefined"} className={inputClass}>
            {eventStatuses.map((value) => (
              <option key={value} value={value}>
                {eventStatusLabels[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={labelClass}>
        Título
        <input name="title" required maxLength={200} defaultValue={event?.title ?? ""} placeholder="Ex: Primeiro encontro" className={inputClass} />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Tipo de evento
          <select name="eventType" defaultValue={event?.eventType ?? ""} className={inputClass}>
            <option value="">Não informado</option>
            {eventTypes.map((value) => (
              <option key={value} value={value}>
                {eventTypeLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Canal
          <select name="channel" defaultValue={event?.channel ?? ""} className={inputClass}>
            <option value="">Não informado</option>
            {channels.map((value) => (
              <option key={value} value={value}>
                {channelLabels[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Local
          <select name="locationType" defaultValue={event?.locationType ?? ""} className={inputClass}>
            <option value="">Não informado</option>
            {locationTypes.map((value) => (
              <option key={value} value={value}>
                {locationTypeLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Tom emocional
          <select name="emotionalTone" defaultValue={event?.emotionalTone ?? ""} className={inputClass}>
            <option value="">Não informado</option>
            {emotionalTones.map((value) => (
              <option key={value} value={value}>
                {emotionalToneLabels[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={labelClass}>
        Resultado
        <select name="outcome" defaultValue={event?.outcome ?? ""} className={inputClass}>
          <option value="">Não informado</option>
          {outcomes.map((value) => (
            <option key={value} value={value}>
              {outcomeLabels[value]}
            </option>
          ))}
        </select>
      </label>
      {allTags.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags do evento</legend>
          <div className="mt-2">
            <TagMultiSelect options={allTags} dropdownOptions={dropdownOptions} value={tagIds} onChange={setTagIds} name="tags" placeholder="Buscar tags de evento…" />
          </div>
        </fieldset>
      )}
      <label className={labelClass}>
        Descrição
        <textarea name="description" rows={3} defaultValue={event?.description ?? ""} placeholder="Opcional" className={inputClass} />
      </label>
    </>
  );
}
