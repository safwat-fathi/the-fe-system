import { getTranslations } from "next-intl/server";

import LoginForm from "./components/LoginForm";
import ChangeLocale from "./components/ChangeLocale";

export default async function Login() {
  const t = await getTranslations("auth.login");

  return (
    <div className="bg-[#f5f5f5] font-['Cairo'] min-h-screen flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="text-center mb-6 overflow-hidden">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight animate-fade-slide-down">
            <span className="text-7xl text-[#1e293b] block animate-fade-slide-down-sm delay-150">
              {t("brand.title")}
            </span>
            <span className="text-xl text-[#00A2E8] mb-2 block animate-fade-slide-down-sm delay-300">
              {t("brand.subtitle")}
            </span>
          </h1>

          <p className="text-lg text-gray-500 mt-2 animate-fade-slide-up delay-500">
            {t("tagline")}
            {/* 💰 */}
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
