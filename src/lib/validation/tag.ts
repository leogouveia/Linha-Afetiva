import { z } from "zod";

export const tagColors = [
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#64748b", // slate
] as const;

export const tagSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da tag.").max(50, "Nome muito longo."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida."),
});

export type TagInput = z.infer<typeof tagSchema>;
