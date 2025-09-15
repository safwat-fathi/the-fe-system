"use server";

import { z } from "zod";
import { loginSchema } from "@/utilities/schemas/login.schema";

import { setCookieAction } from "./cookie-store";
import { STORAGE_KEYS } from "@/constants";
import { User } from "@/types/services/auth";
import { redirect } from "next/navigation";
import { authService } from "@/services/api";
import { cookies } from "next/headers";
interface LoginResult {
  success: boolean;
  message?: string;
  user?: User;
}

export async function loginAction(
  state: unknown,
  formData: FormData,
): Promise<LoginResult | void> {
  // Validate form data using Zod schema
  const result = loginSchema.safeParse(formData);

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

  try {
    // Call authentication service
    const response = await authService.login({ username, password });
    console.log("🚀 ~ :42 ~ loginAction ~ response:", response);

    if (response.success && response.data) {
      // Extract token and user data from response
      const token = response.data.token;

      if (!token) {
        loginResult = {
          success: false,
          message: "بيانات تسجيل الدخول غير صحيحة",
        };
      } else {
        // Set secure cookie with token
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiration

        await setCookieAction(STORAGE_KEYS.AUTH_TOKEN, token, {
          maxAge: expires.getTime() / 1000,
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
    redirect("/dashboard");
  } else {
    return loginResult as LoginResult;
  }
}

export async function onLogoutAction() {
  (await cookies()).set(STORAGE_KEYS.AUTH_TOKEN, "", {
    maxAge: 0,
  });
}
