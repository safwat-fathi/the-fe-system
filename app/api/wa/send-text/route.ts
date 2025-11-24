import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { whatsappService } from "@/services/external/whatsapp.service";

export const runtime = "nodejs";

const payloadSchema = z.object({
  to: z.string().min(5),
  body: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { to, body } = payloadSchema.parse(payload);
    const idempotencyKey =
      request.headers.get("idempotency-key") ??
      request.headers.get("Idempotency-Key") ??
      undefined;

    const result = await whatsappService.sendText({
      to,
      body,
      clientMsgId: idempotencyKey,
    });

    return NextResponse.json(
      {
        message: "Text message sent",
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
            : "Failed to send WhatsApp text message",
      },
      { status },
    );
  }
}
