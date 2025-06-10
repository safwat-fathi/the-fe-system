"use client";
import { useRouter } from "next/navigation";
import { Button, Form, Input, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import React from "react";

export default function Login() {
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Login successful");
    router.push("/dashboard"); // توجيه المستخدم للصفحة الرئيسية بعد تسجيل الدخول
  };

  return (
    <div className="font-['cairo'] bg-default-50 flex min-h-screen items-center justify-center p-4">
      <div className="bg-content1 flex w-full max-w-sm flex-col gap-4 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-medium">مرحباً بك في إمداد</h2>
        <Form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Input label="Email" name="email" type="email" variant="bordered" placeholder="Enter your email" required />
          <Input label="Password" name="password" type="password" variant="bordered" placeholder="Enter your password" required />
          <Button className="w-full" color="primary" type="submit">Sign In</Button>
        </Form>
      </div>
    </div>
  );
}
