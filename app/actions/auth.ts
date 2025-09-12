"use server";

import { z } from "zod";
import { LoginFormState, loginSchema } from "@/utilities/schemas/login.schema";

import { setCookieAction, getCookieAction } from "./cookie-store";
import { STORAGE_KEYS } from "@/constants";
import { User } from "@/types/services/auth";
import { redirect } from "next/navigation";
import { authService } from "@/services/api";
import { loginUser } from "@/utilities";

interface LoginResult {
  success: boolean;
  message?: string;
  user?: User;
}

export async function loginAction(
  state: unknown,
  formData: FormData,
): Promise<LoginResult> {
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

  try {
    // Call authentication service
    const response = await authService.login({ username, password });
    // const response = await loginUser( username, password);
    console.log("🚀 ~ :42 ~ loginAction ~ response:", response);

    if (response.success && response.data) {
      // Extract token and user data from response
      const token = response.data.token;

      if (!token) {
        return {
          success: false,
          message: "بيانات تسجيل الدخول غير صحيحة",
        };
      }

      // Set secure cookie with token
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiration

      await setCookieAction(STORAGE_KEYS.AUTH_TOKEN, token, {
        maxAge: expires.getTime() / 1000,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      // Redirect to dashboard on successful login
      redirect("/dashboard");
    } else {
      return {
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
        return {
          success: false,
          message: "لا يمكن الاتصال بالخادم. تأكد من اتصال الإنترنت.",
        };
      } else if (error.message.includes("JSON")) {
        return {
          success: false,
          message: "استجابة غير صحيحة من الخادم.",
        };
      } else {
        return {
          success: false,
          message: error.message,
        };
      }
    } else {
      return {
        success: false,
        message: "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
      };
    }
  }
}
