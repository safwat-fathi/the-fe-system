"use server";

import { deleteCookieAction } from "./cookie-store";
import { STORAGE_KEYS } from "@/constants";
import { redirect } from "next/navigation";

export async function logoutAction() {
  try {
    // Delete the auth token cookie
    await deleteCookieAction(STORAGE_KEYS.AUTH_TOKEN);
    await deleteCookieAction(STORAGE_KEYS.REFRESH_TOKEN);
    
    // Redirect to login page
    redirect("/");
  } catch (error) {
    console.error("Error during logout:", error);
    // Still redirect to login page even if cookie deletion fails
    redirect("/");
  }
}
