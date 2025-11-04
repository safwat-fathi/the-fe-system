import { Metadata } from "next";

import TokenDisplay from "./components/TokenDisplay";
import DynamicDataTable from "./components/DynamicDataTable";
import TableSelector from "./components/TableSelector";

import Breadcrumb from "@/components/Breadcrumb";
import genericService from "@/services/api/generic.service";
import { getCookieAction } from "@/app/actions/cookie-store";
import { getBranchParams } from "@/app/actions/branch-params";
import { STORAGE_KEYS } from "@/constants";

export const metadata: Metadata = {
  title: "اختبار HttpService - NafeesWeb",
  description: "صفحة تجريبية لاختبار نظام HttpService الجديد",
};

interface TestServicePageProps {
  searchParams: Promise<{ table?: string }>;
}

export default async function TestServicePage({
  searchParams,
}: TestServicePageProps) {
  const params = await searchParams;
  const tableName = params.table || "home_list";

  // جلب Tokens من الكوكيز
  const accessToken = await getCookieAction(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = await getCookieAction(STORAGE_KEYS.REFRESH_TOKEN);

  // جلب معاملات الفرع والسنة
  const branchParams = await getBranchParams();

  // جلب بيانات الجدول المختار باستخدام HttpService الجديد
  let tableData;
  let error = null;
  let responseDebug = null;

  try {
    const response = await genericService.getTableData(tableName, branchParams);

    tableData = response.data || [];
    responseDebug = response;

    if (!response.success) {
      error = response.message || "فشل في جلب البيانات";
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "حدث خطأ غير معروف";
    tableData = [];
  }

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">
        اختبار نظام HttpService الجديد - الجدول الديناميكي
      </h1>

      {/* Table Selector */}
      <TableSelector currentTable={tableName} />

      {/* عرض Tokens */}
      <TokenDisplay accessToken={accessToken} refreshToken={refreshToken} />

      {/* عرض معاملات الطلب */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold mb-2">📊 معاملات الطلب (Request Params):</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <strong>Branch (com):</strong> {branchParams.com}
          </div>
          <div>
            <strong>Year:</strong> {branchParams.year}
          </div>
        </div>
      </div>

      {/* عرض حالة الطلب */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">
          نتيجة جلب بيانات {tableName}:
        </h2>
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>خطأ:</strong> {error}
          </div>
        ) : (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>نجح!</strong> تم جلب {tableData.length} سجل
          </div>
        )}

        {/* Debug info */}
        {responseDebug && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold mb-2">🔍 Debug Info:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Success:</strong>{" "}
                {responseDebug.success ? "✅ نعم" : "❌ لا"}
              </div>
              <div>
                <strong>Message:</strong>{" "}
                {responseDebug.message || "لا توجد رسالة"}
              </div>
              <div>
                <strong>Data Count:</strong> {responseDebug.data?.length || 0}
              </div>
              <div>
                <strong>Data Type:</strong>{" "}
                {Array.isArray(responseDebug.data)
                  ? "Array"
                  : typeof responseDebug.data}
              </div>
              <div>
                <strong>API Base URL:</strong>{" "}
                {process.env.NEXT_PUBLIC_API_BASE_URL || "غير محدد"}
              </div>
              <div>
                <strong>Table Name:</strong> {tableName}
              </div>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer font-bold">
                عرض الاستجابة الكاملة
              </summary>
              <pre className="text-xs overflow-x-auto mt-2 bg-white p-2 rounded">
                {JSON.stringify(responseDebug, null, 2)}
              </pre>
            </details>
            <details className="mt-2">
              <summary className="cursor-pointer font-bold">
                عرض المعاملات المرسلة
              </summary>
              <pre className="text-xs overflow-x-auto mt-2 bg-white p-2 rounded">
                {JSON.stringify(branchParams, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* عرض البيانات في جدول */}
      <DynamicDataTable data={tableData} tableName={tableName} />

      {/* معلومات إضافية */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold mb-2">📋 ملاحظات:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>هذه الصفحة تستخدم نظام HttpService الجديد لاختبار الـ API</li>
          <li>
            يمكنك اختيار أي جدول من القائمة المنسدلة أو كتابة اسم جدول مخصص
          </li>
          <li>يتم عرض Tokens الحالية والمستخدمة في الطلبات</li>
          <li>يتم عرض معاملات الطلب (Branch و Year) تلقائياً</li>
          <li>يمكنك رؤية معلومات Debug كاملة حول الاستجابة</li>
        </ul>
      </div>
    </div>
  );
}
