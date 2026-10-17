import { z } from "zod";

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "O nickname deve ter no mínimo 3 caracteres.")
  .max(30, "O nickname pode ter no máximo 30 caracteres.")
  .regex(
    USERNAME_REGEX,
    "Use apenas letras (a-z), números (0-9) e underscores (_), sem espaços ou acentos."
  );

export function sanitizeUsernameCandidate(seed: string): string {
  const normalized = seed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);

  if (normalized.length >= 3) {
    return normalized;
  }
  return `aventureiro_${Math.floor(1000 + Math.random() * 9000)}`;
}

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Formato de e-mail inválido."),
  password: z
    .string()
    .min(6, "A senha deve conter no mínimo 6 caracteres."),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "O nome deve ter pelo menos 2 caracteres.")
      .max(80, "Nome muito longo."),
    username: usernameSchema,
    email: z
      .string()
      .trim()
      .min(1, "Informe seu e-mail.")
      .email("Formato de e-mail inválido."),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .regex(/[A-Za-z]/, "A senha deve conter letras.")
      .regex(/[0-9]/, "A senha deve conter ao menos um número."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, "O código deve ter exatamente 6 caracteres alfanuméricos."),
  type: z.enum(["REGISTER", "CHANGE_EMAIL"]),
  email: z.string().email().optional(),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(80, "Nome muito longo."),
  username: usernameSchema,
  avatarType: z.enum([
    "oauth",
    "preset_warrior",
    "preset_mage",
    "preset_rogue",
    "preset_cleric",
    "preset_d20",
    "preset",
  ]),
  avatarUrl: z.string().optional().nullable(),
  statusPresence: z.enum(["online", "in_game", "away", "offline"]).default("online"),
  timezone: z.string().min(2).max(50).default("America/Sao_Paulo"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres.")
      .regex(/[A-Za-z]/, "A nova senha deve conter letras.")
      .regex(/[0-9]/, "A nova senha deve conter ao menos um número."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "A confirmação da nova senha não coincide.",
    path: ["confirmPassword"],
  });

export const requestEmailChangeSchema = z.object({
  newEmail: z
    .string()
    .trim()
    .min(1, "Informe o novo endereço de e-mail.")
    .email("Formato de e-mail inválido."),
});

export const deleteAccountSchema = z.object({
  confirmation: z.string().trim().min(1, "Digite a confirmação exigida."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
