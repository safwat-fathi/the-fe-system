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
import { motion } from "framer-motion";

export default function Login() {
  const router = useRouter();

  const [branches, setBranches] = useState<{ id: number; comp_name: string }[]>([]);
  const [branch, setBranch] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setMounted(true);
    fetchCompanies().then((data) => {
      if (Array.isArray(data)) setBranches(data as any);
      setIsLoading(false);
    });
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!branch || !year) {
      setFormError("* يجب اختيار الفرع وكتابة السنة المالية");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    setTimeout(() => {
      localStorage.setItem("selectedBranch", branch);
      localStorage.setItem("selectedYear", year);
      router.push("/dashboard");
    }, 1000); // محاكاة عملية تسجيل دخول
  };

  if (!mounted) return null;

  return (
    <div className="bg-[#f5f5f5] font-['Cairo'] min-h-screen flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="text-center mb-6 overflow-hidden">
          <motion.h1
            className="text-3xl font-extrabold text-gray-800 tracking-tight"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              className="text-7xl text-[#1e293b] block"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              نفيس
            </motion.span>
            <motion.span
              className="text-xl text-[#00A2E8] mb-2 block"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Web
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-lg text-gray-500 mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            حيث يلتقي بريق الذهب بالتقنية 
            {/* 💰 */}
          </motion.p>
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

          <Select
            label="اختيار الفرع"
            selectedKeys={branch ? [branch] : []}
            onSelectionChange={(keys) => setBranch(Array.from(keys)[0] as string)}
            className="text-right w-full"
            isDisabled={isLoading}
          >
            {isLoading ? (
              <SelectItem key="loading" isDisabled>
                جاري تحميل الفروع...
              </SelectItem>
            ) : (
              branches.map((b) => (
                <SelectItem key={String(b.id)}>{b.comp_name}</SelectItem>
              ))
            )}
          </Select>

          <Input
            label="السنة المالية"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            variant="bordered"
            placeholder="مثال: 2024"
            className="text-right"
          />

          {formError && (
            <p className="text-red-500 text-sm text-right mt-1">{formError}</p>
          )}

          <Spacer y={2} />

          <Button
            type="submit"
            variant="flat"
            className="w-full !bg-[#1e293b] text-white font-semibold hover:!bg-[#111827] transition rounded-lg flex items-center justify-center gap-2"
            isDisabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : null}
            {isSubmitting ? "جارٍ الدخول..." : "دخول النظام"}
          </Button>
        </Form>
      </div>
    </div>
  );
}
