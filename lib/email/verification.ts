import { randomInt } from "crypto";
import { Resend } from "resend";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailVerificationCodes } from "@/lib/db/schema";
import { env } from "@/lib/env";

// Alfabeto alfanumérico maiúsculo sem símbolos ambíguos (O/0, I/1)
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateSixCharCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    const idx = randomInt(0, CODE_ALPHABET.length);
    code += CODE_ALPHABET[idx];
  }
  return code.toUpperCase();
}

export function buildDarkDungeonVerificationEmailHtml(params: {
  recipientName?: string | null;
  code: string;
  type: "REGISTER" | "CHANGE_EMAIL";
}): string {
  const { recipientName, code, type } = params;
  const greetingName = recipientName || "Nobre aventureiro(a)";
  const actionTitle =
    type === "REGISTER"
      ? "Selo de confirmação de cadastro"
      : "Selo de alteração de e-mail";
  const actionDescription =
    type === "REGISTER"
      ? "Para ativar definitivamente sua conta no Salão da Guilda, liberar pedidos de amizade e participar de mesas compartilhadas, utilize o código rúnico abaixo:"
      : "Você solicitou a alteração do endereço de e-mail vinculado à sua conta no Salão da Guilda. Insira o código abaixo para confirmar a mudança:";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${actionTitle} — Dragões & Masmorras</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0d10;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f5f0e6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b0d10;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#12161c;border:1px solid #292524;border-radius:14px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.65);">
          <!-- Cabeçalho Salão da Guilda -->
          <tr>
            <td style="padding:28px 28px 20px 28px;border-bottom:1px solid #1e293b;text-align:center;background:linear-gradient(180deg,#1a1f29 0%,#12161c 100%);">
              <div style="display:inline-block;padding:4px 12px;border-radius:999px;border:1px solid rgba(245,158,11,0.35);background-color:rgba(245,158,11,0.1);color:#fbbf24;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
                Salão da guilda • D&amp;D v.3.5
              </div>
              <h1 style="margin:12px 0 4px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:1px;color:#f5f0e6;">
                DRAGÕES &amp; MASMORRAS
              </h1>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                ${actionTitle}
              </p>
            </td>
          </tr>

          <!-- Corpo da Mensagem -->
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#e2e8f0;">
                Saudações, <strong style="color:#fbbf24;">${greetingName}</strong>!
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#cbd5e1;">
                ${actionDescription}
              </p>

              <!-- Caixa do Código Monoespaçado Âmbar/Ouro -->
              <div style="background-color:#0b0d10;border:1px solid rgba(245,158,11,0.45);border-radius:12px;padding:22px 16px;text-align:center;margin-bottom:22px;">
                <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:8px;">
                  Código de verificação (6 dígitos)
                </span>
                <div style="font-family:'JetBrains Mono','Courier New',monospace;font-size:34px;font-weight:800;letter-spacing:8px;color:#f59e0b;text-shadow:0 0 18px rgba(245,158,11,0.25);">
                  ${code}
                </div>
              </div>

              <!-- Validade de 15 Minutos -->
              <div style="background-color:#181d26;border-left:3px solid #f59e0b;padding:12px 14px;border-radius:6px;margin-bottom:8px;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#cbd5e1;">
                  ⏳ <strong>Atenção ao tempo de conjuração:</strong> este código é válido estritamente por <strong>15 minutos</strong>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Rodapé de Segurança -->
          <tr>
            <td style="padding:18px 28px;background-color:#0e1217;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:11px;line-height:1.5;color:#64748b;">
                Se você não solicitou este código no aplicativo <strong>Dragões &amp; Masmorras</strong>, ignore este e-mail com segurança. Nenhuma alteração será feita sem a confirmação do código.
              </p>
              <p style="margin:0;font-size:11px;color:#475569;">
                © ${new Date().getFullYear()} Dragões &amp; Masmorras • Sistema de referência D&amp;D 3.5
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function issueAndSendVerificationCode(params: {
  userId: string;
  email: string;
  recipientName?: string | null;
  type: "REGISTER" | "CHANGE_EMAIL";
  enforceCooldown?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  cooldownRemainingSeconds?: number;
  sentViaResend: boolean;
  devPreviewCode?: string;
}> {
  const {
    userId,
    email,
    recipientName,
    type,
    enforceCooldown = true,
  } = params;
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Verificar cooldown de 60 segundos contra abuso
  if (enforceCooldown) {
    const [latestCode] = await db
      .select()
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.userId, userId),
          eq(emailVerificationCodes.type, type)
        )
      )
      .orderBy(desc(emailVerificationCodes.createdAt))
      .limit(1);

    if (latestCode) {
      const elapsedMs = Date.now() - new Date(latestCode.createdAt).getTime();
      if (elapsedMs < 60_000) {
        const remaining = Math.ceil((60_000 - elapsedMs) / 1000);
        return {
          success: false,
          error: `Aguarde ${remaining}s antes de solicitar um novo código.`,
          cooldownRemainingSeconds: remaining,
          sentViaResend: false,
        };
      }
    }
  }

  // 2. Gerar código de 6 caracteres maiúsculos e validade estrita de 15 minutos
  const code = generateSixCharCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(emailVerificationCodes).values({
    userId,
    email: normalizedEmail,
    code,
    type,
    expiresAt,
  });

  // 3. Enviar via Resend se RESEND_API_KEY estiver configurada
  const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  const fromAddress =
    env.EMAIL_FROM ||
    process.env.EMAIL_FROM ||
    "Salão da Guilda <onboarding@resend.dev>";

  const subject =
    type === "REGISTER"
      ? `[${code}] Código de verificação — Dragões & Masmorras`
      : `[${code}] Confirmação de novo e-mail — Dragões & Masmorras`;

  const html = buildDarkDungeonVerificationEmailHtml({
    recipientName,
    code,
    type,
  });

  if (!apiKey || apiKey === "re_sua_chave_api_do_resend") {
    console.info(
      `[Salão da Guilda - Modo Dev] Código de verificação (${type}) para ${normalizedEmail}: ${code}`
    );
    return {
      success: true,
      sentViaResend: false,
      devPreviewCode: code,
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: [normalizedEmail],
      subject,
      html,
    });

    if (error) {
      console.warn("[Resend] Aviso ao enviar e-mail:", error);
      // Caso o domínio ainda esteja em sandbox (onboarding@resend.dev enviando para outro destinatário),
      // fornecemos o código de fallback para não bloquear o teste do usuário.
      return {
        success: true,
        sentViaResend: false,
        devPreviewCode: code,
      };
    }

    return {
      success: true,
      sentViaResend: true,
    };
  } catch (err) {
    console.warn("[Resend] Exceção ao disparar e-mail:", err);
    return {
      success: true,
      sentViaResend: false,
      devPreviewCode: code,
    };
  }
}
