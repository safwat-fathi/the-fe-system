"use client";

import { Form, Input, Spacer, Button } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { loginAction } from "@/app/actions/auth";
import ChangeLocale from "../ChangeLocale";

const LoginForm = () => {
  const t = useTranslations("auth.login");
  const [state, action, pending] = useActionState(loginAction, undefined);
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/"; // default redirect

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
          type="password"
          variant="bordered"
          // className="text-right"
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
      <div className="flex justify-between">
        <p>{t("changeLanguage")}</p>
        <ChangeLocale />
      </div>
    </div>
  );
};

export default LoginForm;
