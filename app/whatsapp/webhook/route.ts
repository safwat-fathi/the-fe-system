import { NextRequest, NextResponse } from "next/server";

import { ensureWhatsappConfig } from "@/config/whatsapp";
import processWhatsappWebhook from "@/app/actions/whatsapp/webhook-processor";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const config = ensureWhatsappConfig();
    const url = request.nextUrl;
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === config.verifyToken) {
      return new NextResponse(challenge ?? "", { status: 200 });
    }

    return new NextResponse("Forbidden", { status: 403 });
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "WhatsApp service not configured",
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await processWhatsappWebhook(body);

    return new NextResponse(null, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        message: "Failed to process webhook",
      },
      { status: 500 },
    );
  }
}
