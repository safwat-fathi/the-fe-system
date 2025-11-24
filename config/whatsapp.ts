import { logger } from "@/utilities/logger";

const maskToken = (value: string): string => {
  if (!value) return "";

  const visible = 4;
  const maskedLength = Math.max(value.length - visible, 0);

  return `${"*".repeat(maskedLength)}${value.slice(-visible)}`;
};

const ensureEnv = (key: string, value?: string): string => {
  if (!value) {
    const message = `Missing required WhatsApp environment variable: ${key}`;

    logger.error(message);
    throw new Error(message);
  }

  return value;
};

const baseUrl = ensureEnv("WHATSAPP_BASE_URL", process.env.WHATSAPP_BASE_URL);
const token = ensureEnv("WHATSAPP_TOKEN", process.env.WHATSAPP_TOKEN);
const phoneNumberId = ensureEnv("PHONE_NUMBER_ID", process.env.PHONE_NUMBER_ID);
const verifyToken = ensureEnv("VERIFY_TOKEN", process.env.VERIFY_TOKEN);

if (!baseUrl.startsWith("https://")) {
  const message = "WHATSAPP_BASE_URL must use HTTPS";

  logger.error(message);
  throw new Error(message);
}

export const whatsappConfig = {
  baseUrl,
  token,
  phoneNumberId,
  verifyToken,
  maskedToken: maskToken(token),
} as const;

export type WhatsappConfig = typeof whatsappConfig;
