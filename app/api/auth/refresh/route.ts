import { deleteCredentials, onLogoutAction } from "@/app/actions/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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
          error instanceof Error
            ? error.message
            : "Failed to process request",
      },
      { status: 500 },
    );
  }
}
