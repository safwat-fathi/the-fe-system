"use server";

import { redirect } from "next/navigation";

import { deleteCookieAction } from "./cookie-store";

import { STORAGE_KEYS } from "@/constants";

export async function logoutAction() {
  try {
    // Delete the auth token cookie
    await deleteCookieAction(STORAGE_KEYS.ACCESS_TOKEN);

    // Redirect to login page
    redirect("/");
  } catch (error) {
    console.error("Error during logout:", error);
    // Still redirect to login page even if cookie deletion fails
    redirect("/");
  }
}
