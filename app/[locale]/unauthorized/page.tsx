import Link from "next/link";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "غير مصرح - 401",
  description: "عذراً، ليس لديك صلاحية الوصول إلى هذه الصفحة.",
};

export default async function UnauthorizedPage() {
  const t = await getTranslations("unauthorized");
  const locale = await getLocale();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="text-9xl font-bold text-primary-500 mb-4">401</div>
          <h1 className="text-3xl font-bold mb-2">{t("heading")}</h1>
          <p className="text-gray-600 mb-8">{t("body")}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            className="btn btn-primary w-full sm:w-auto"
            href={`/${locale}`}
          >
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
