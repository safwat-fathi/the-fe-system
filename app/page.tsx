"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  Form,
  Input,
  Select,
  SelectItem,
  Spacer,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { fetchCompanies } from "@/utilities/api";

export default function Login() {
  const router = useRouter();
  const [branches, setBranches] = useState<{ id: number; comp_name: string }[]>(
    []
  );
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
    router.push("/dashboard");
  };

  return (
    <div className="bg-[#f5f5f5] font-['Cairo'] min-h-screen flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            نظام <span className="text-[#d4af37]">بازار</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2">تسجيل دخول لإدارة الذهب والمعاملات</p>
        </div>

        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="اسم المستخدم"
            name="username"
            type="text"
            variant="bordered"
            placeholder="مثال: admin"
            required
            className="text-right"
          />

          <Input
            label="كلمة المرور"
            name="password"
            type="password"
            variant="bordered"
            placeholder="••••••••"
            required
            className="text-right"
          />

          {branches.length > 0 && (
            <Select
              label="اختيار الفرع"
              selectedKeys={branch ? [branch] : []}
              onSelectionChange={(keys) => setBranch(Array.from(keys)[0] as string)}
              className="text-right"
            >
              {branches.map((b) => (
                <SelectItem key={String(b.id)}>{b.comp_name}</SelectItem>
              ))}
            </Select>
          )}

          <Input
            label="السنة المالية"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            variant="bordered"
            placeholder="مثال: 2024"
            className="text-right"
          />

          <Spacer y={2} />

          <Button
            type="submit"
            className="w-full bg-[#d4af37] text-white font-semibold hover:bg-[#bfa32d] transition rounded-lg"
          >
            دخول النظام
          </Button>
        </Form>
      </div>
    </div>
  );
}
