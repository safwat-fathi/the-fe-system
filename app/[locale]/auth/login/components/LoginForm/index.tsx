"use client";

import { Form, Input, Spacer, Button } from "@heroui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import ChangeLocale from "../ChangeLocale";

import { usePermissionStore } from "@/stores/permissionStore";
import { loginAction, type LoginResult } from "@/app/actions/auth";

const LoginForm = () => {
  const router = useRouter();
  const setPermissions = usePermissionStore((state) => state.setPermissions);
  const t = useTranslations("auth.login");

  const [state, action, pending] = useActionState<
    LoginResult | void | undefined,
    FormData
  >(loginAction, undefined);
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Watch for successful login action resolution
  useEffect(() => {
    if (state?.success && state?.redirectUrl) {
      if (state.permissions) {
        setPermissions(state.permissions);
      }

      router.push(state.redirectUrl);
      router.refresh();
    }
  }, [state, router, setPermissions]);

  return (
    <div className="flex flex-col gap-4">
      <Form action={action} className="flex flex-col gap-4">
        <input name="redirect" type="hidden" value={redirectPath} />
        <Input
          required
          className="text-right"
          label={t("usernameLabel")}
          name="username"
          placeholder={t("usernamePlaceholder")}
          type="text"
          variant="bordered"
        />

        <Input
          required
          label={t("passwordLabel")}
          name="password"
          placeholder={t("passwordPlaceholder")}
          type={isPasswordVisible ? "text" : "password"}
          variant="bordered"
          endContent={
            <button
              type="button"
              onClick={() => setIsPasswordVisible((v) => !v)}
              className="focus:outline-none p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={isPasswordVisible ? t("hidePassword") : t("showPassword")}
            >
              {isPasswordVisible ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          }
        />

        {!state?.success && (
          <p className="text-red-500 text-sm text-right mt-1">
            {state?.message}
          </p>
        )}

        <Spacer y={2} />

        <Button
          className="w-full !bg-[#1e293b] text-white font-semibold hover:!bg-[#111827] transition rounded-lg flex items-center justify-center gap-2"
          isDisabled={pending}
          type="submit"
          variant="flat"
        >
          {pending ? (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : null}
          {pending ? t("submitting") : t("submit")}
        </Button>
      </Form>
      <div className="flex justify-center mt-4">
        <ChangeLocale />
      </div>
    </div>
  );
};

export default LoginForm;
