import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface UpsertContactInput {
  waId: string;
  name?: string | null;
  optinState?: string;
}

export interface UpsertConversationInput {
  contactId: string;
  lastMsgAt?: Date;
  status?: string;
}

export interface CreateMessageInput {
  conversationId: string;
  contactId: string;
  direction: "inbound" | "outbound";
  type: string;
  bodyJson: Prisma.JsonValue;
  waMsgId?: string;
  status?: string;
  errorCode?: string | null;
  clientMsgId?: string | null;
  createdAt?: Date;
}

export interface UpdateMessageStatusInput {
  waMsgId: string;
  status: string;
  errorCode?: string | null;
}

export interface StoreMediaInput {
  waMediaId: string;
  mime: string;
  size?: number | null;
  url?: string | null;
  expiresAt?: Date | null;
  messageId?: string | null;
}

export interface FetchMessagesParams {
  contactId: string;
  limit?: number;
  cursor?: string;
}

class WhatsappRepository {
  async upsertContact(input: UpsertContactInput) {
    const { waId, name, optinState } = input;

    return prisma.contact.upsert({
      where: { waId },
      update: {
        name: name ?? undefined,
        optinState: optinState ?? undefined,
      },
      create: {
        waId,
        name: name ?? undefined,
        optinState: optinState ?? "unknown",
      },
    });
  }

  async upsertConversation(input: UpsertConversationInput) {
    const { contactId, lastMsgAt, status } = input;

    return prisma.conversation.upsert({
      where: { contactId },
      update: {
        lastMsgAt: lastMsgAt ?? undefined,
        status: status ?? undefined,
      },
      create: {
        contactId,
        lastMsgAt: lastMsgAt ?? undefined,
        status: status ?? "open",
      },
    });
  }

  async findConversationByContact(contactId: string) {
    return prisma.conversation.findFirst({
      where: { contactId },
    });
  }

  async createMessage(input: CreateMessageInput) {
    if (input.waMsgId) {
      const existing = await prisma.message.findUnique({
        where: { waMsgId: input.waMsgId },
      });

      if (existing) {
        return existing;
      }
    }

    if (input.clientMsgId) {
      const existing = await prisma.message.findUnique({
        where: { clientMsgId: input.clientMsgId },
      });

      if (existing) {
        return existing;
      }
    }

    return prisma.message.create({
      data: {
        conversationId: input.conversationId,
        contactId: input.contactId,
        direction: input.direction,
        type: input.type,
        bodyJson: input.bodyJson,
        waMsgId: input.waMsgId ?? undefined,
        status: input.status ?? "pending",
        errorCode: input.errorCode ?? undefined,
        clientMsgId: input.clientMsgId ?? undefined,
        createdAt: input.createdAt ?? undefined,
      },
    });
  }

  async updateMessageStatus(input: UpdateMessageStatusInput) {
    return prisma.message.update({
      where: { waMsgId: input.waMsgId },
      data: {
        status: input.status,
        errorCode: input.errorCode ?? undefined,
      },
    });
  }

  async storeMedia(input: StoreMediaInput) {
    const existing = await prisma.media.findUnique({
      where: { waMediaId: input.waMediaId },
    });

    if (existing) {
      return prisma.media.update({
        where: { waMediaId: input.waMediaId },
        data: {
          mime: input.mime,
          size: input.size ?? undefined,
          url: input.url ?? undefined,
          expiresAt: input.expiresAt ?? undefined,
          messageId: input.messageId ?? undefined,
        },
      });
    }

    return prisma.media.create({
      data: {
        waMediaId: input.waMediaId,
        mime: input.mime,
        size: input.size ?? undefined,
        url: input.url ?? undefined,
        expiresAt: input.expiresAt ?? undefined,
        messageId: input.messageId ?? undefined,
      },
    });
  }

  async linkMediaToMessage(messageId: string, mediaId: string) {
    return prisma.media.update({
      where: { id: mediaId },
      data: {
        messageId,
      },
    });
  }

  async getMessages(params: FetchMessagesParams) {
    const { contactId, limit = 50, cursor } = params;

    return prisma.message.findMany({
      where: { contactId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
      include: {
        media: true,
        conversation: true,
        contact: true,
      },
    });
  }

  async getContactByWaId(waId: string) {
    return prisma.contact.findUnique({
      where: { waId },
      include: { conversations: true },
    });
  }
}

export const whatsappRepository = new WhatsappRepository();

export default whatsappRepository;

