import { z } from "zod";
import { zfd } from "zod-form-data";

export const loginSchema = zfd.formData({
  username: zfd.text(z.string().min(1, { message: "اسم المستخدم مطلوب" })),
  password: zfd.text(z.string().min(1, { message: "كلمة المرور مطلوبة" })),
  // csrfToken: zfd.text(z.string().min(1, { message: "CSRF token is required" })),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export type LoginFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
