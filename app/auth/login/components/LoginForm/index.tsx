"use client";

import { loginAction } from "@/app/actions/auth";
import { Form, Input, Spacer, Button } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";


const LoginForm = () => {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/"; // default redirect

  return (
    <Form className="flex flex-col gap-4" action={action}>
      <input type="hidden" name="redirect" value={redirectPath} />
      {/* <input type="hidden" name="csrfToken" value={csrfToken} /> */}
      <Input
        name="username"
        label="اسم المستخدم"
        type="text"
        variant="bordered"
        placeholder="مثال: admin"
        required
        className="text-right"
      />

      <Input
        name="password"
        label="كلمة المرور"
        type="password"
        variant="bordered"
        placeholder="••••••••"
        required
        // className="text-right"
      />

      {!state?.success && (
        <p className="text-red-500 text-sm text-right mt-1">{state?.message}</p>
      )}

      <Spacer y={2} />

      <Button
        type="submit"
        variant="flat"
        className="w-full !bg-[#1e293b] text-white font-semibold hover:!bg-[#111827] transition rounded-lg flex items-center justify-center gap-2"
        isDisabled={pending}
      >
        {pending ? (
          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
        ) : null}
        {pending ? "جارٍ الدخول..." : "دخول النظام"}
      </Button>
    </Form>
  );
};

export default LoginForm;
