"use server";

import { cookies } from "next/headers";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export async function getCookieAction(name: string) {
  return cookies().get(name)?.value;
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
  cookies().set({
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
  cookies().delete(name);
}

export async function onLogoutAction() {
  cookies().delete("token");
}

export async function appRedirect(route: string) {
  redirect(route);
}

export async function revalidate(key: string) {
  revalidateTag(key);
}
