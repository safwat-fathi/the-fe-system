import { NextResponse } from "next/server";

import { deleteCredentials } from "@/app/actions/auth";

export async function POST() {
  try {
    // TODO: Implement refresh token
    await deleteCredentials();

    return NextResponse.json(
      { message: "token refreshed successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 },
    );
  }
}
