import { z } from "zod";

// "undefined" means "not specified" — it must never overwrite people.currentStatus (see event API routes).
export const eventStatuses = ["active", "paused", "ended", "undefined"] as const;
export type EventStatus = (typeof eventStatuses)[number];

export const eventStatusLabels: Record<EventStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  ended: "Encerrado",
  undefined: "Indefinido",
};

export const datePrecisions = ["day", "month", "year", "approx"] as const;
export type DatePrecision = (typeof datePrecisions)[number];

export const datePrecisionLabels: Record<DatePrecision, string> = {
  day: "Data exata",
  month: "Só mês/ano",
  year: "Só o ano",
  approx: "Aproximada",
};

export const eventTypes = ["encontro", "primeiro-encontro", "conversa", "convite", "programa-marcado", "sexo", "briga", "reaproximacao", "afastamento", "encerramento", "observacao"] as const;
export type EventType = (typeof eventTypes)[number];

export const eventTypeLabels: Record<EventType, string> = {
  encontro: "Encontro",
  "primeiro-encontro": "Primeiro encontro",
  conversa: "Conversa",
  convite: "Convite",
  "programa-marcado": "Programa marcado",
  sexo: "Sexo",
  briga: "Briga",
  reaproximacao: "Reaproximação",
  afastamento: "Afastamento",
  encerramento: "Encerramento",
  observacao: "Observação",
};

export const channels = ["presencial", "whatsapp", "instagram", "tinder", "grindr", "telefone", "outro"] as const;
export type Channel = (typeof channels)[number];

export const channelLabels: Record<Channel, string> = {
  presencial: "Presencial",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tinder: "Tinder",
  grindr: "Grindr",
  telefone: "Telefone",
  outro: "Outro",
};

export const locationTypes = ["bar", "festa", "teatro", "cinema", "restaurante", "minha-casa", "casa-dele", "rua", "virtual", "outro"] as const;
export type LocationType = (typeof locationTypes)[number];

export const locationTypeLabels: Record<LocationType, string> = {
  bar: "Bar",
  festa: "Festa",
  teatro: "Teatro",
  cinema: "Cinema",
  restaurante: "Restaurante",
  "minha-casa": "Minha casa",
  "casa-dele": "Casa dele",
  rua: "Rua",
  virtual: "Virtual",
  outro: "Outro",
};

export const emotionalTones = ["muito-bom", "bom", "neutro", "confuso", "ruim", "muito-ruim"] as const;
export type EmotionalTone = (typeof emotionalTones)[number];

export const emotionalToneLabels: Record<EmotionalTone, string> = {
  "muito-bom": "Muito bom",
  bom: "Bom",
  neutro: "Neutro",
  confuso: "Confuso",
  ruim: "Ruim",
  "muito-ruim": "Muito ruim",
};

// Outcome's own "indefinido" is a distinct enum from eventStatuses' "undefined" — different fields.
export const outcomes = ["aproximou", "manteve", "esfriou", "afastou", "encerrou", "reabriu", "indefinido"] as const;
export type Outcome = (typeof outcomes)[number];

export const outcomeLabels: Record<Outcome, string> = {
  aproximou: "Aproximou",
  manteve: "Manteve",
  esfriou: "Esfriou",
  afastou: "Afastou",
  encerrou: "Encerrou",
  reabriu: "Reabriu",
  indefinido: "Indefinido",
};

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) => z.preprocess(emptyToUndefined, z.enum(values).optional());

// The fields of a registro (acontecimento); shared by event routes and person creation.
export const eventFieldsSchema = z.object({
  date: z.coerce.date({ error: "Informe a data." }),
  datePrecision: z.enum(datePrecisions).default("day"),
  title: z.string().trim().min(1, "Informe o título.").max(200, "Título muito longo."),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(5000, "Texto muito longo.").optional()),
  eventType: optionalEnum(eventTypes),
  channel: optionalEnum(channels),
  locationType: optionalEnum(locationTypes),
  emotionalTone: optionalEnum(emotionalTones),
  outcome: optionalEnum(outcomes),
  status: z.enum(eventStatuses, { error: "Situação inválida." }),
  tagIds: z.array(z.number().int().positive()).max(100).default([]),
});

export const eventSchema = eventFieldsSchema.extend({
  personId: z.number({ error: "Informe a pessoa." }).int().positive(),
});

export type EventFieldsInput = z.infer<typeof eventFieldsSchema>;
export type EventInput = z.infer<typeof eventSchema>;
