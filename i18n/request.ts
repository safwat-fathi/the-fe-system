"use server";

import { getRequestConfig } from "next-intl/server";

import { Locale, defaultLocale, locales } from "./config";
import { getMessages } from "./messages";

export default getRequestConfig(async ({ requestLocale }) => {
	const rawLocale = (await requestLocale) as Locale | undefined;
	
	const resolvedLocale = locales.includes(rawLocale as Locale)
		? (rawLocale as Locale)
		: defaultLocale;

	return {
		locale: resolvedLocale,
		messages: await getMessages(resolvedLocale),
	};
});
