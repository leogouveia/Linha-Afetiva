import { z } from "zod";
import { eventFieldsSchema } from "./event";

export const personOrigins = ["Tinder", "Grindr", "Pessoalmente", "Espontâneo", "Outro App", "Não informado"] as const;
export type PersonOrigin = (typeof personOrigins)[number];

const identityFields = {
  name: z.string().trim().min(1, "Informe o nome."),
  origin: z.enum(personOrigins, { error: "Informe a origem." }),
  avatar: z.string().nullable().optional(),
};

// Creating a person always creates their first registro along with the identity.
export const personCreateSchema = z.object(identityFields).extend(eventFieldsSchema.shape);

// Updating a person only touches the identity; registros have their own routes.
export const personUpdateSchema = z.object(identityFields);

export type PersonCreateInput = z.infer<typeof personCreateSchema>;
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>;
