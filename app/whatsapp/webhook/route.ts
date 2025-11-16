import { whatsappConfig } from "@/config/whatsapp";
import processWhatsappWebhook from "@/app/actions/whatsapp/webhook-processor";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === whatsappConfig.verifyToken) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await processWhatsappWebhook(body);

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to process webhook",
      },
      { status: 500 },
    );
  }
}

