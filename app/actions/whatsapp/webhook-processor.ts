"use server";

import whatsappRepository from "@/services/external/whatsapp.repository";
import logger from "@/utilities/logger";

interface WhatsappWebhookValue {
  messages?: Array<{
    id: string;
    from: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    image?: { id: string; caption?: string };
    audio?: { id: string };
    video?: { id: string; caption?: string };
    document?: { id: string; caption?: string; filename?: string };
    sticker?: { id: string };
    interactive?: Record<string, unknown>;
    errors?: Array<{ code: number; title: string; message: string }>;
  }>;
  statuses?: Array<{
    id: string;
    status: string;
    timestamp: string;
    recipient_id: string;
    conversation?: { id: string; expiration_timestamp?: string };
    pricing?: { billable: boolean; category: string; pricing_model: string };
    errors?: Array<{ code: number; title: string; message: string }>;
  }>;
  contacts?: Array<{
    wa_id: string;
    profile?: { name?: string };
  }>;
}

type WhatsappMessage = NonNullable<WhatsappWebhookValue["messages"]>[number];

interface WhatsappWebhookChange {
  value: WhatsappWebhookValue;
}

interface WhatsappWebhookEntry {
  changes: WhatsappWebhookChange[];
}

interface WhatsappWebhookPayload {
  entry?: WhatsappWebhookEntry[];
}

const parseTimestamp = (timestamp: string) =>
  timestamp ? new Date(Number(timestamp) * 1000) : new Date();

const mapMessageTypeToPayload = (message: WhatsappMessage | undefined) => {
  if (!message) return {};

  const { type } = message;

  switch (type) {
    case "text":
      return { text: message.text };
    case "image":
      return { image: message.image };
    case "audio":
      return { audio: message.audio };
    case "video":
      return { video: message.video };
    case "document":
      return { document: message.document };
    case "sticker":
      return { sticker: message.sticker };
    default:
      return { [type]: (message as any)[type] };
  }
};

export const processWhatsappWebhook = async (
  payload: WhatsappWebhookPayload,
) => {
  if (!payload.entry?.length) {
    logger.warn("[WhatsappWebhook] Empty payload received");

    return;
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const { value } = change;

      if (!value) {
        continue;
      }

      const contacts = value.contacts ?? [];

      // Handle incoming messages
      if (value.messages?.length) {
        for (const message of value.messages) {
          const contactProfile = contacts.find(
            (contact) => contact.wa_id === message.from,
          );

          const contact = await whatsappRepository.upsertContact({
            waId: message.from,
            name: contactProfile?.profile?.name,
          });

          const conversation = await whatsappRepository.upsertConversation({
            contactId: contact.id,
            lastMsgAt: parseTimestamp(message.timestamp),
          });

          const payloadJson = mapMessageTypeToPayload(message);

          const storedMessage = await whatsappRepository.createMessage({
            contactId: contact.id,
            conversationId: conversation.id,
            direction: "inbound",
            type: message.type,
            bodyJson: payloadJson,
            waMsgId: message.id,
            status: "received",
            createdAt: parseTimestamp(message.timestamp),
          });

          const mediaId =
            message.image?.id ??
            message.audio?.id ??
            message.video?.id ??
            message.document?.id ??
            message.sticker?.id;

          if (mediaId) {
            await whatsappRepository.storeMedia({
              waMediaId: mediaId,
              mime: message.type,
              messageId: storedMessage.id,
            });
          }
        }
      }

      // Handle message statuses
      if (value.statuses?.length) {
        for (const status of value.statuses) {
          try {
            await whatsappRepository.updateMessageStatus({
              waMsgId: status.id,
              status: status.status,
              errorCode: status.errors?.[0]?.code?.toString(),
            });
          } catch (error) {
            logger.error("[WhatsappWebhook] Failed to update status", {
              waMsgId: status.id,
              error,
            });
          }
        }
      }
    }
  }
};

export default processWhatsappWebhook;
