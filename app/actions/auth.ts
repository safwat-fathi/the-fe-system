"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";

import { setCookieAction } from "./cookie-store";

import { loginSchema } from "@/app/[locale]/auth/login/components/LoginForm/login.schema";
import { STORAGE_KEYS } from "@/constants";
import { locales } from "@/i18n/config";
import { authService } from "@/services/api";
import userService from "@/app/[locale]/(pages)/settings/permissions/services/user.service";
import { generateCSRFToken } from "@/utilities/csrf";
import { resolvePermissionsFromPayload } from "@/utilities/auth/authorization-core";

export interface LoginResult {
  success: boolean;
  message?: string;
  permissions?: any;
  redirectUrl?: string;
  data?: {
    access: string;
    refresh: string;
  };
}

type LoginResponseData = {
  access?: string;
  refresh?: string;
  user_id?: number;
  is_admin?: boolean;
  username?: string;
  com?: number;
  cost?: number;
  fin_year?: number;
};

const buildRedirectPath = (redirectPath: string, locale: string) => {
  const normalized = redirectPath.startsWith("/")
    ? redirectPath
    : `/${redirectPath}`;
  const hasLocalePrefix = locales.some(
    (loc) => normalized === `/${loc}` || normalized.startsWith(`/${loc}/`),
  );

  if (hasLocalePrefix) {
    return normalized;
  }

  const suffix = normalized === "/" ? "" : normalized;

  return `/${locale}${suffix}`;
};

async function persistCredentials(responseData: LoginResponseData) {
  const accessToken = responseData.access;
  const refreshToken = responseData.refresh;
  const userId = responseData.user_id;
  const isAdmin = responseData.is_admin;
  const companyId = responseData.com;
  const costId = responseData.cost;
  const finYear = responseData.fin_year;

  if (!accessToken || !refreshToken) {
    return false;
  }

  const ACCESS_TOKEN_TTL = 60 * 60;              // 1 hour in seconds
  const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30;  // 30 days in seconds

  await setCookieAction(STORAGE_KEYS.ACCESS_TOKEN, accessToken, {
    maxAge: ACCESS_TOKEN_TTL,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  await setCookieAction(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, {
    maxAge: REFRESH_TOKEN_TTL,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  if (typeof userId !== "undefined") {
    await setCookieAction(STORAGE_KEYS.USER_ID, String(userId), {
      maxAge: REFRESH_TOKEN_TTL,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  if (typeof isAdmin !== "undefined") {
    await setCookieAction(STORAGE_KEYS.IS_ADMIN, String(isAdmin), {
      maxAge: REFRESH_TOKEN_TTL,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  if (typeof companyId !== "undefined") {
    await setCookieAction(STORAGE_KEYS.COMPANY_ID, String(companyId), {
      maxAge: REFRESH_TOKEN_TTL,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  if (typeof costId !== "undefined") {
    await setCookieAction(STORAGE_KEYS.COST_ID, String(costId), {
      maxAge: REFRESH_TOKEN_TTL,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  if (typeof finYear !== "undefined") {
    await setCookieAction(STORAGE_KEYS.FIN_YEAR, String(finYear), {
      maxAge: REFRESH_TOKEN_TTL,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  const username = responseData.username;

  if (typeof username !== "undefined") {
    await setCookieAction(STORAGE_KEYS.USERNAME, String(username), {
      maxAge: REFRESH_TOKEN_TTL,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  await generateCSRFToken();

  return true;
}

function formatLoginError(error: unknown): LoginResult {
  if (error instanceof Error) {
    if (error.message.includes("fetch") || error.message.includes("Network")) {
      return {
        success: false,
        message: "لا يمكن الاتصال بالخادم. تأكد من اتصال الإنترنت.",
      };
    }

    if (error.message.includes("JSON")) {
      return {
        success: false,
        message: "استجابة غير صحيحة من الخادم.",
      };
    }

    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: false,
    message: "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
  };
}


const LOGIN_INVALID_CREDENTIALS_PHRASES = [
  "no active account found with the given credentials",
  "unable to log in with provided credentials",
  "invalid credentials",
  "invalid username or password",
  "اسم المستخدم أو كلمة المرور غير صحيحة",
  "Invalid username or password",
];

function isInvalidCredentialsApiMessage(message: string | undefined): boolean {
  if (!message || typeof message !== "string") return false;
  const normalized = message.trim().toLowerCase();

  return LOGIN_INVALID_CREDENTIALS_PHRASES.some((phrase) =>
    normalized.includes(phrase.toLowerCase()),
  );
}

export async function loginAction(
  state: unknown,
  formData: FormData,
): Promise<LoginResult | void> {
  // Validate form data using Zod schema
  const result = loginSchema.safeParse(formData);
  const redirectPath = (formData.get("redirect") as string) || "/";

  const locale = await getLocale();

  if (!result.success) {
    // Return validation errors
    const errors = z.treeifyError(result.error);

    return {
      success: false,
      message:
        errors.properties?.username?.errors[0] ||
        errors.properties?.password?.errors[0] ||
        "بيانات غير صحيحة",
    };
  }

  const { username, password } = result.data;

  const requestOptions: RequestInit = {
    signal: AbortSignal.timeout(30000), // 30 seconds
  };

  try {
    // Call authentication service
    const response = await authService.login(
      { username, password },
      requestOptions,
    );

    if (!response.success || !response.data) {
      const t = await getTranslations("auth.login");
      const invalidCredentialsMsg = t("invalidCredentials");
      const message = response.message?.trim() || invalidCredentialsMsg;
      const useLocalizedMessage = isInvalidCredentialsApiMessage(message);

      return {
        success: false,
        message: useLocalizedMessage ? invalidCredentialsMsg : message,
      };
    }

    const persisted = await persistCredentials(response.data);

    if (!persisted) {
      return {
        success: false,
        message: "بيانات تسجيل الدخول غير صحيحة",
      };
    }
  } catch (error) {
    return formatLoginError(error);
  }

  const finalRedirect = buildRedirectPath(redirectPath, locale);

  redirect(finalRedirect);
}

export async function getUserPermissions() {
  const response = await userService.getAuthPermissions();

  if (!response.success) {
    return null;
  }

  const parsed = resolvePermissionsFromPayload(response.data ?? response);

  if (!parsed.hasPermissionsArray) {
    return null;
  }

  return parsed.permissions;
}

export async function deleteCredentials() {
  const cookieStore = await cookies();

  cookieStore.set(STORAGE_KEYS.ACCESS_TOKEN, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.REFRESH_TOKEN, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.CSRF_TOKEN, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.USER_ID, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.USERNAME, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.IS_ADMIN, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.COMPANY_ID, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.COST_ID, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.FIN_YEAR, "", { maxAge: 0 });
}
export async function onLogoutAction() {
  await deleteCredentials();
  await redirectToLogin();
}

export async function redirectToLogin() {
  const locale = await getLocale();

  redirect(`/${locale}/auth/login`);
}
