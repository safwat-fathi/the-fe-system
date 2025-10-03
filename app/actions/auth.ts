"use server";

import { z } from "zod";
import { loginSchema } from "@/utilities/schemas/login.schema";
import { validateCSRFToken } from "@/utilities/csrf";

import { setCookieAction } from "./cookie-store";
import { STORAGE_KEYS } from "@/constants";
import { redirect } from "next/navigation";
import { authService } from "@/services/api";
import { cookies } from "next/headers";

interface LoginResult {
  success: boolean;
  message?: string;
  data?: {
    access: string;
    refresh: string;
  };
}

export async function loginAction(
  state: unknown,
  formData: FormData,
): Promise<LoginResult | void> {
  // Validate form data using Zod schema
  const result = loginSchema.safeParse(formData);
  const redirectPath = (formData.get("redirect") as string) || "/";
  const csrfToken = formData.get("csrfToken") as string;

  // Validate CSRF token
  const isCSRFValid = await validateCSRFToken(csrfToken);
  if (!isCSRFValid) {
    return {
      success: false,
      message: "طلب غير مصرح به. يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.",
    };
  }

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
  let loginSuccess = false;
  let loginResult: LoginResult | null = null;

  const requestOptions: RequestInit = {
    signal: AbortSignal.timeout(30000), // 30 seconds
  };

  try {
    // Call authentication service
    const response = await authService.login(
      { username, password },
      requestOptions,
    );

    if (response.success && response.data) {
      // Extract token and user data from response
      const access_token = response.data.access;
      const refresh_token = response.data.refresh;

      if (!access_token) {
        loginResult = {
          success: false,
          message: "بيانات تسجيل الدخول غير صحيحة",
        };
      } else {
        // Set secure cookie with access token
        const accessTokenExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiration

        await setCookieAction(STORAGE_KEYS.ACCESS_TOKEN, access_token, {
          maxAge: accessTokenExpires.getTime() / 1000,
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        const refreshTokenExpires = new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 30,
        ); // 30 day expiration

        // Set secure cookie with refresh token
        await setCookieAction(STORAGE_KEYS.REFRESH_TOKEN, refresh_token, {
          maxAge: refreshTokenExpires.getTime() / 1000,
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        // Mark login as successful
        loginSuccess = true;
      }
    } else {
      loginResult = {
        success: false,
        message:
          response.message ||
          "فشل في تسجيل الدخول. يرجى التحقق من البيانات المدخلة.",
      };
    }
  } catch (error) {
    console.error("خطأ في تسجيل الدخول:", error);

    // Handle different types of errors
    if (error instanceof Error) {
      if (
        error.message.includes("fetch") ||
        error.message.includes("Network")
      ) {
        loginResult = {
          success: false,
          message: "لا يمكن الاتصال بالخادم. تأكد من اتصال الإنترنت.",
        };
      } else if (error.message.includes("JSON")) {
        loginResult = {
          success: false,
          message: "استجابة غير صحيحة من الخادم.",
        };
      } else {
        loginResult = {
          success: false,
          message: error.message,
        };
      }
    } else {
      loginResult = {
        success: false,
        message: "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
      };
    }
  }

  // Redirect after successful login or return error result
  if (loginSuccess) {
    redirect(redirectPath);
  } else {
    return loginResult as LoginResult;
  }
}

export async function onLogoutAction() {
  (await cookies()).set(STORAGE_KEYS.ACCESS_TOKEN, "", {
    maxAge: 0,
  });

  redirect("/auth/login");
}
