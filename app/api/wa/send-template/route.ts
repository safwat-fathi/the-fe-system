import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { whatsappService } from "@/services/external/whatsapp.service";
import { assertAuthorized } from "@/utilities/auth/authorization-server";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/utilities/errors/Authentication";

export const runtime = "nodejs";

const componentSchema = z.object({
  type: z.string(),
  parameters: z.array(
    z.object({
      type: z.string(),
      text: z.string().optional(),
      image: z.object({ link: z.string().url() }).optional(),
      video: z.object({ link: z.string().url() }).optional(),
      document: z
        .object({
          link: z.string().url(),
          filename: z.string().optional(),
        })
        .optional(),
    }),
  ),
});

const payloadSchema = z.object({
  to: z.string().min(5),
  templateName: z.string().min(1),
  languageCode: z.string().min(2),
  components: z.array(componentSchema).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await assertAuthorized({
      subject: "settings.integrations",
      action: "create",
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    if (error instanceof AuthorizationError) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const { to, templateName, languageCode, components } =
      payloadSchema.parse(payload);

    const idempotencyKey =
      request.headers.get("idempotency-key") ??
      request.headers.get("Idempotency-Key") ??
      undefined;

    const result = await whatsappService.sendTemplate({
      to,
      templateName,
      languageCode,
      components,
      clientMsgId: idempotencyKey,
    });

    return NextResponse.json(
      {
        message: "Template message sent",
        waMessageId: result.response.messages?.[0]?.id,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid payload", errors: error.flatten() },
        { status: 400 },
      );
    }

    const status = (error as any)?.code === "190" ? 401 : 500;

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to send WhatsApp template message",
      },
      { status },
    );
  }
}
