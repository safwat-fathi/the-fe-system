import crypto from "node:crypto";

import { whatsappConfig } from "@/config/whatsapp";
import whatsappHttpService from "@/services/external/whatsapp-http.service";
import whatsappRepository from "@/services/external/whatsapp.repository";
import logger from "@/utilities/logger";

type WhatsappMessageRecord = {
  createdAt?: Date | string | null;
} | null;

interface SendTextPayload {
  to: string;
  body: string;
  clientMsgId?: string;
}

interface SendTemplatePayload {
  to: string;
  templateName: string;
  languageCode: string;
  components?: Record<string, unknown>[];
  clientMsgId?: string;
}

interface UploadMediaPayload {
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
}

interface SendMediaPayload {
  to: string;
  mediaId: string;
  type: "image" | "video" | "audio" | "document" | "sticker";
  caption?: string;
  clientMsgId?: string;
}

interface FetchMessagesOptions {
  contact: string;
  limit?: number;
  cursor?: string;
}

interface WhatsappApiMessageResponse {
  messages: { id: string }[];
}

interface WhatsappApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
  };
}

const generateIdempotencyKey = () => crypto.randomUUID();

class WhatsappService {
  private getPhoneNumberId() {
    const { phoneNumberId } = whatsappConfig;

    if (!phoneNumberId) {
      throw new Error(
        "WhatsApp service is not configured. Please set PHONE_NUMBER_ID environment variable.",
      );
    }

    return phoneNumberId;
  }

  private async ensureContact(to: string) {
    return whatsappRepository.upsertContact({
      waId: to,
    });
  }

  private async ensureConversation(contactId: string) {
    const conversation =
      await whatsappRepository.findConversationByContact(contactId);

    if (conversation) {
      return conversation;
    }

    return whatsappRepository.upsertConversation({
      contactId,
    });
  }

  private isWithinSessionWindow(message?: WhatsappMessageRecord) {
    if (!message?.createdAt) return false;

    const now = Date.now();
    const last = new Date(message.createdAt).getTime();
    const diffHours = (now - last) / (1000 * 60 * 60);

    return diffHours <= 24;
  }

  private async recordOutboundMessage(options: {
    contactId: string;
    conversationId: string;
    waMsgId?: string;
    payload: unknown;
    type: string;
    clientMsgId?: string;
  }) {
    const { contactId, conversationId, payload, type, waMsgId, clientMsgId } =
      options;

    return whatsappRepository.createMessage({
      contactId,
      conversationId,
      direction: "outbound",
      type,
      bodyJson: payload as Record<string, unknown>,
      waMsgId,
      status: waMsgId ? "sent" : "pending",
      clientMsgId,
    });
  }

  private parseWhatsappError(error: unknown) {
    const fallback = {
      message: "Failed to process WhatsApp API request",
      code: "WHATSAPP_API_ERROR",
    };

    if (!error || typeof error !== "object") {
      return fallback;
    }

    const apiError = error as WhatsappApiError;

    if (!apiError.error) {
      return fallback;
    }

    return {
      message: apiError.error.error_user_msg ?? apiError.error.message,
      code: apiError.error.code?.toString() ?? fallback.code,
    };
  }

  async sendText(payload: SendTextPayload) {
    const clientMsgId = payload.clientMsgId ?? generateIdempotencyKey();
    const contact = await this.ensureContact(payload.to);
    const conversation = await this.ensureConversation(contact.id);

    const requestBody = {
      messaging_product: "whatsapp",
      to: payload.to,
      type: "text",
      text: {
        body: payload.body,
      },
    };

    try {
      const response =
        await whatsappHttpService.postJson<WhatsappApiMessageResponse>(
          `${this.getPhoneNumberId()}/messages`,
          requestBody,
          clientMsgId,
        );

      const waMsgId = response.data.messages?.[0]?.id;

      const message = await this.recordOutboundMessage({
        contactId: contact.id,
        conversationId: conversation.id,
        waMsgId,
        type: "text",
        payload: requestBody,
        clientMsgId,
      });

      await whatsappRepository.upsertConversation({
        contactId: contact.id,
        lastMsgAt: new Date(),
      });

      return { message, response: response.data };
    } catch (error) {
      const { code, message } = this.parseWhatsappError(error);

      logger.error("[WhatsappService] sendText failed", { code, message });
      // });

      await whatsappRepository.createMessage({
        conversationId: conversation.id,
        contactId: contact.id,
        direction: "outbound",
        type: "error",
        bodyJson: { error: message },
        status: "failed",
        errorCode: code,
        clientMsgId: `${clientMsgId}-error`,
      });

      throw Object.assign(new Error(message), { code });
    }
  }

  async sendTemplate(payload: SendTemplatePayload) {
    const clientMsgId = payload.clientMsgId ?? generateIdempotencyKey();
    const contact = await this.ensureContact(payload.to);
    const conversation = await this.ensureConversation(contact.id);

    const lastMessage = await whatsappRepository.getMessages({
      contactId: contact.id,
      limit: 1,
    });

    if (!this.isWithinSessionWindow(lastMessage[0])) {
      logger.info(
        "[WhatsappService] Sending template outside 24h session window",
        contact.waId,
      );
    }

    const requestBody = {
      messaging_product: "whatsapp",
      to: payload.to,
      type: "template",
      template: {
        name: payload.templateName,
        language: { code: payload.languageCode },
        components: payload.components ?? [],
      },
    };

    try {
      const response =
        await whatsappHttpService.postJson<WhatsappApiMessageResponse>(
          `${this.getPhoneNumberId()}/messages`,
          requestBody,
          clientMsgId,
        );

      const waMsgId = response.data.messages?.[0]?.id;

      const message = await this.recordOutboundMessage({
        contactId: contact.id,
        conversationId: conversation.id,
        waMsgId,
        type: "template",
        payload: requestBody,
        clientMsgId,
      });

      await whatsappRepository.upsertConversation({
        contactId: contact.id,
        lastMsgAt: new Date(),
      });

      return { message, response: response.data };
    } catch (error) {
      const { code, message } = this.parseWhatsappError(error);

      logger.error("[WhatsappService] sendTemplate failed", { code, message });
      throw Object.assign(new Error(message), { code });
    }
  }

  async uploadMedia(payload: UploadMediaPayload) {
    const formData = new FormData();

    formData.append("file", new Blob([payload.fileBuffer]), payload.fileName);
    formData.append("type", payload.mimeType);

    try {
      const response = await whatsappHttpService.postFormData<{ id: string }>(
        `${this.getPhoneNumberId()}/media`,
        formData,
      );

      logger.info("[WhatsappService] Media uploaded", {
        mediaId: response.data.id,
      });

      await whatsappRepository.storeMedia({
        waMediaId: response.data.id,
        mime: payload.mimeType,
      });

      return response.data;
    } catch (error) {
      const { code, message } = this.parseWhatsappError(error);

      logger.error("[WhatsappService] uploadMedia failed", { code, message });
      throw Object.assign(new Error(message), { code });
    }
  }

  async sendMedia(payload: SendMediaPayload) {
    const clientMsgId = payload.clientMsgId ?? generateIdempotencyKey();
    const contact = await this.ensureContact(payload.to);
    const conversation = await this.ensureConversation(contact.id);

    const mediaPayload: Record<string, unknown> = {
      id: payload.mediaId,
    };

    if (payload.caption && payload.type === "image") {
      mediaPayload.caption = payload.caption;
    }

    const requestBody = {
      messaging_product: "whatsapp",
      to: payload.to,
      type: payload.type,
      [payload.type]: mediaPayload,
    };

    try {
      const response =
        await whatsappHttpService.postJson<WhatsappApiMessageResponse>(
          `${this.getPhoneNumberId()}/messages`,
          requestBody,
          clientMsgId,
        );

      const waMsgId = response.data.messages?.[0]?.id;

      const message = await this.recordOutboundMessage({
        contactId: contact.id,
        conversationId: conversation.id,
        waMsgId,
        type: payload.type,
        payload: requestBody,
        clientMsgId,
      });

      await whatsappRepository.storeMedia({
        waMediaId: payload.mediaId,
        mime: payload.type,
        messageId: message.id,
      });

      await whatsappRepository.upsertConversation({
        contactId: contact.id,
        lastMsgAt: new Date(),
      });

      return { message, response: response.data };
    } catch (error) {
      const { code, message } = this.parseWhatsappError(error);

      logger.error("[WhatsappService] sendMedia failed", { code, message });
      throw Object.assign(new Error(message), { code });
    }
  }

  async getMessages(options: FetchMessagesOptions) {
    const contact = await whatsappRepository.getContactByWaId(options.contact);

    if (!contact) {
      return [];
    }

    return whatsappRepository.getMessages({
      contactId: contact.id,
      limit: options.limit,
      cursor: options.cursor,
    });
  }
}

export const whatsappService = new WhatsappService();

export default whatsappService;
