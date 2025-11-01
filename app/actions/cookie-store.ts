"use server";

import { cookies } from "next/headers";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export async function getCookieAction(name: string) {
  return (await cookies()).get(name)?.value;
}

export async function setCookieAction(
  name: string,
  value: string,
  options?: {
    maxAge?: number;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "strict" | "lax" | "none";
  },
) {
  (await cookies()).set({
    name,
    value,
    httpOnly: options?.httpOnly ?? true,
    secure: options?.secure ?? true,
    sameSite: options?.sameSite ?? "lax",
    path: options?.path ?? "/",
    maxAge: options?.maxAge,
  } as ResponseCookie);
}

export async function deleteCookieAction(name: string) {
  (await cookies()).delete(name);
}
