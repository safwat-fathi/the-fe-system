import { Buffer } from "node:buffer";

import { NextRequest, NextResponse } from "next/server";

import { whatsappService } from "@/services/external/whatsapp.service";
import { assertAuthorized } from "@/utilities/auth/authorization-server";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/utilities/errors/Authentication";

export const runtime = "nodejs";

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
    const formData = await request.formData();
    const file = formData.get("file");
    const type =
      (formData.get("type") as string | null | undefined) ??
      (file instanceof File ? file.type : undefined);

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Missing file field" },
        { status: 400 },
      );
    }

    if (!type) {
      return NextResponse.json(
        { message: "Missing mime type" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { id } = await whatsappService.uploadMedia({
      fileName: file.name || "upload",
      fileBuffer: buffer,
      mimeType: type,
    });

    return NextResponse.json({ mediaId: id }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to upload WhatsApp media",
      },
      { status: 500 },
    );
  }
}
