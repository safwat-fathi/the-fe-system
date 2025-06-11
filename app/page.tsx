"use client";
import { useRouter } from "next/navigation";
import { Button, Form, Input, Link, Select, SelectItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import React, { useEffect, useState } from "react";
import { fetchCompanies } from "@/utilities/api";

export default function Login() {
  const router = useRouter();
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [branch, setBranch] = useState<string>("");
  const [year, setYear] = useState<string>("");

  useEffect(() => {
    fetchCompanies().then((data) => {
      if (Array.isArray(data)) setBranches(data as any);
    });
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (branch) localStorage.setItem("selectedBranch", branch);
    if (year) localStorage.setItem("selectedYear", year);
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
          <Select
            label="الفرع"
            selectedKeys={branch ? [branch] : []}
            onSelectionChange={(keys) => setBranch(Array.from(keys)[0] as string)}
          >
            {branches.map((b) => (
              <SelectItem key={String(b.id)}>{b.name}</SelectItem>
            ))}
          </Select>
          <Input
            label="السنة"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            variant="bordered"
            placeholder="2024"
          />
          <Button className="w-full" color="primary" type="submit">Sign In</Button>
        </Form>
      </div>
    </div>
  );
}
