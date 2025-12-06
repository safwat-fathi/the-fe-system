import { logger } from "@/utilities/logger";

const maskToken = (value: string): string => {
  if (!value) return "";

  const visible = 4;
  const maskedLength = Math.max(value.length - visible, 0);

  return `${"*".repeat(maskedLength)}${value.slice(-visible)}`;
};

// جعل المتغيرات البيئية اختيارية لتجنب أخطاء البناء
const baseUrl = process.env.WHATSAPP_BASE_URL || "";
const token = process.env.WHATSAPP_TOKEN || "";
const phoneNumberId = process.env.PHONE_NUMBER_ID || "";
const verifyToken = process.env.VERIFY_TOKEN || "";

// دالة للتحقق من الإعدادات عند الاستخدام الفعلي
export const ensureWhatsappConfig = (): {
  baseUrl: string;
  token: string;
  phoneNumberId: string;
  verifyToken: string;
} => {
  if (!baseUrl) {
    throw new Error("Missing required WhatsApp environment variable: WHATSAPP_BASE_URL");
  }

  if (!token) {
    throw new Error("Missing required WhatsApp environment variable: WHATSAPP_TOKEN");
  }

  if (!phoneNumberId) {
    throw new Error("Missing required WhatsApp environment variable: PHONE_NUMBER_ID");
  }

  if (!verifyToken) {
    throw new Error("Missing required WhatsApp environment variable: VERIFY_TOKEN");
  }

  if (!baseUrl.startsWith("https://")) {
    throw new Error("WHATSAPP_BASE_URL must use HTTPS");
  }

  return {
    baseUrl,
    token,
    phoneNumberId,
    verifyToken,
  };
};

export const whatsappConfig = {
  baseUrl,
  token,
  phoneNumberId,
  verifyToken,
  maskedToken: maskToken(token),
} as const;

export type WhatsappConfig = typeof whatsappConfig;
