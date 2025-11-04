import { Metadata } from "next";

import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "صفحة اختبار - NafeesWeb",
  description: "صفحة اختبار النظام",
};

export default function TestPage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">صفحة اختبار</h1>
        <div className="space-y-4">
          <p className="text-gray-600">هذه صفحة اختبار للتحقق من عمل النظام.</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">
              ✅ النظام يعمل بشكل صحيح
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
