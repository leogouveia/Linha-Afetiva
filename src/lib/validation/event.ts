import { z } from "zod";

export const eventStatuses = ["active", "paused", "ended"] as const;
export type EventStatus = (typeof eventStatuses)[number];

export const eventStatusLabels: Record<EventStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  ended: "Encerrado",
};

export const datePrecisions = ["day", "month", "year", "approx"] as const;
export type DatePrecision = (typeof datePrecisions)[number];

export const datePrecisionLabels: Record<DatePrecision, string> = {
  day: "Data exata",
  month: "Só mês/ano",
  year: "Só o ano",
  approx: "Aproximada",
};

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

// The fields of a registro (acontecimento); shared by event routes and person creation.
export const eventFieldsSchema = z.object({
  date: z.coerce.date({ error: "Informe a data." }),
  datePrecision: z.enum(datePrecisions).default("day"),
  status: z.enum(eventStatuses, { error: "Situação inválida." }),
  note: z.preprocess(emptyToUndefined, z.string().trim().max(5000, "Texto muito longo.").optional()),
  tagIds: z.array(z.number().int().positive()).max(100).default([]),
});

export const eventSchema = eventFieldsSchema.extend({
  personId: z.number({ error: "Informe a pessoa." }).int().positive(),
});

export type EventFieldsInput = z.infer<typeof eventFieldsSchema>;
export type EventInput = z.infer<typeof eventSchema>;
