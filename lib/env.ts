import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória."),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET é obrigatória."),
  AUTH_URL: z.string().url().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  RESEND_API_KEY: z
    .string()
    .min(1, "RESEND_API_KEY é necessária para envio de e-mails transacionais.")
    .optional(),
  EMAIL_FROM: z
    .string()
    .min(1, "EMAIL_FROM é obrigatório.")
    .default("Salão da Guilda <onboarding@resend.dev>"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function getEnv(): EnvConfig {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM:
      process.env.EMAIL_FROM || "Salão da Guilda <onboarding@resend.dev>",
  });

  if (!parsed.success) {
    console.warn(
      "[env] Aviso de validação de variáveis de ambiente:",
      parsed.error.flatten().fieldErrors
    );
    return {
      DATABASE_URL: process.env.DATABASE_URL || "",
      AUTH_SECRET: process.env.AUTH_SECRET || "",
      AUTH_URL: process.env.AUTH_URL,
      AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
      AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM:
        process.env.EMAIL_FROM || "Salão da Guilda <onboarding@resend.dev>",
    };
  }

  return parsed.data;
}

export const env = getEnv();
