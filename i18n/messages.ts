import type { Locale } from "./config";

export async function getMessages(locale: Locale) {
  switch (locale) {
    case "ar":
      return (await import("../messages/ar.json")).default;
    case "en":
      return (await import("../messages/en.json")).default;
    default:
      throw new Error(`Unknown locale: ${locale}`);
  }
}
