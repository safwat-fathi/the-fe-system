"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";

import { setCookieAction } from "./cookie-store";

import { loginSchema } from "@/app/[locale]/auth/login/components/LoginForm/login.schema";
import { STORAGE_KEYS } from "@/constants";
import { locales } from "@/i18n/config";
import { authService } from "@/services/api";
import { generateCSRFToken } from "@/utilities/csrf";

interface LoginResult {
  success: boolean;
  message?: string;
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

  if (!accessToken || !refreshToken) {
    return false;
  }

  const accessTokenExpires = new Date(Date.now() + 1000 * 60 * 60);
  const refreshTokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await setCookieAction(STORAGE_KEYS.ACCESS_TOKEN, accessToken, {
    maxAge: accessTokenExpires.getTime() / 1000,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  await setCookieAction(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, {
    maxAge: refreshTokenExpires.getTime() / 1000,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  if (typeof userId !== "undefined") {
    await setCookieAction(STORAGE_KEYS.USER_ID, String(userId), {
      maxAge: refreshTokenExpires.getTime() / 1000,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  if (typeof isAdmin !== "undefined") {
    await setCookieAction(STORAGE_KEYS.IS_ADMIN, String(isAdmin), {
      maxAge: refreshTokenExpires.getTime() / 1000,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  if (typeof companyId !== "undefined") {
    await setCookieAction(STORAGE_KEYS.COMPANY_ID, String(companyId), {
      maxAge: refreshTokenExpires.getTime() / 1000,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  if (typeof costId !== "undefined") {
    await setCookieAction(STORAGE_KEYS.COST_ID, String(costId), {
      maxAge: refreshTokenExpires.getTime() / 1000,
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
    signal: AbortSignal.timeout(3000), // 30 seconds
  };

  try {
    // Call authentication service
    const response = await authService.login(
      { username, password },
      requestOptions,
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        message:
          response.message ||
          "فشل في تسجيل الدخول. يرجى التحقق من البيانات المدخلة.",
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

export async function deleteCredentials() {
  const cookieStore = await cookies();

  cookieStore.set(STORAGE_KEYS.ACCESS_TOKEN, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.REFRESH_TOKEN, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.CSRF_TOKEN, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.USER_ID, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.IS_ADMIN, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.COMPANY_ID, "", { maxAge: 0 });
  cookieStore.set(STORAGE_KEYS.COST_ID, "", { maxAge: 0 });
}
export async function onLogoutAction() {
  await deleteCredentials();
  await redirectToLogin();
}

export async function redirectToLogin() {
  const locale = await getLocale();

  redirect(`/${locale}/auth/login`);
}
