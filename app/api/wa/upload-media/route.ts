import { Buffer } from "node:buffer";

import { NextRequest, NextResponse } from "next/server";

import { whatsappService } from "@/services/external/whatsapp.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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
