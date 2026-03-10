import { NextRequest, NextResponse } from "next/server";

import { whatsappService } from "@/services/external/whatsapp.service";
import { assertAuthorized } from "@/utilities/auth/authorization-server";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/utilities/errors/Authentication";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await assertAuthorized({
      subject: "settings.integrations",
      action: "view",
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

  const url = request.nextUrl;
  const contact = url.searchParams.get("contact");
  const limit = url.searchParams.get("limit");
  const cursor = url.searchParams.get("cursor");

  if (!contact) {
    return NextResponse.json(
      { message: "contact query parameter is required" },
      { status: 400 },
    );
  }

  const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;

  if (parsedLimit !== undefined && Number.isNaN(parsedLimit)) {
    return NextResponse.json(
      { message: "limit must be a number" },
      { status: 400 },
    );
  }

  try {
    const messages = await whatsappService.getMessages({
      contact,
      limit: parsedLimit,
      cursor: cursor ?? undefined,
    });

    return NextResponse.json(
      {
        messages,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch WhatsApp messages",
      },
      { status: 500 },
    );
  }
}
