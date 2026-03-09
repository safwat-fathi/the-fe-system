import { getTranslations } from "next-intl/server";

import LoginForm from "./components/LoginForm";

export default async function Login() {
  const t = await getTranslations("auth.login");

  return (
    <div className="login-page-bg bg-gradient-to-br from-[#e8ecf1] via-[#f0f4f8] to-[#e2e8f0] font-['Cairo'] min-h-screen flex flex-col items-center justify-center p-4">
      {/* Floating orbs – decorative background */}
      <div aria-hidden className="login-orb login-orb-1" />
      <div aria-hidden className="login-orb login-orb-2" />
      <div aria-hidden className="login-orb login-orb-3" />
      <div aria-hidden className="login-orb login-orb-4" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm w-full rounded-2xl shadow-xl p-8 border border-gray-200/80">
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
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
