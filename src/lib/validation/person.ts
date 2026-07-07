import { z } from "zod";
import { eventFieldsSchema, eventStatuses } from "./event";

export const personOrigins = ["Tinder", "Grindr", "Pessoalmente", "Espontâneo", "Outro App", "Não informado"] as const;
export type PersonOrigin = (typeof personOrigins)[number];

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

const identityFields = {
  name: z.string().trim().min(1, "Informe o nome."),
  origin: z.enum(personOrigins, { error: "Informe a origem." }),
  avatar: z.string().nullable().optional(),
  currentStatus: z.enum(eventStatuses, { error: "Situação inválida." }).default("undefined"),
  startedAt: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  endedAt: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  howEnded: z.preprocess(emptyToUndefined, z.string().trim().max(500, "Texto muito longo.").optional()),
  generalNotes: z.preprocess(emptyToUndefined, z.string().trim().max(5000, "Texto muito longo.").optional()),
  // Named distinctly from eventFieldsSchema's `tagIds` (event tags) — personCreateSchema merges
  // both, since creating a person also creates their first registro in the same request.
  relationshipTagIds: z.array(z.number().int().positive()).max(100).default([]),
};

// Creating a person always creates their first registro along with the identity.
export const personCreateSchema = z.object(identityFields).extend(eventFieldsSchema.shape);

// Updating a person only touches the identity + relationship tags; registros have their own routes.
export const personUpdateSchema = z.object(identityFields);

export type PersonCreateInput = z.infer<typeof personCreateSchema>;
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>;
