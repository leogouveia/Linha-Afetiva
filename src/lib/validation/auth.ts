import { z } from "zod";
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email("Informe um email válido."), password: z.string().min(1, "Informe sua senha.") });
