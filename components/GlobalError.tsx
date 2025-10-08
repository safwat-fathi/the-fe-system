"use client";

import Link from "next/link";

const isDevelopment = process.env.NODE_ENV === "development";

type GlobalErrorProps = {
	message: string;
	stack: string | undefined;
	onRetry: () => void;
};

export default function GlobalError({ message, stack, onRetry }:  GlobalErrorProps) {
  return (
    <div
      dir="rtl" // Added for right-to-left layout
      className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4"
    >
      {isDevelopment ? (
        // Show error stack in development
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="bg-red-500 p-6 text-center rounded-t-2xl">
            <div className="text-6xl font-bold text-white mb-2">عفوًا!</div>
            <div className="text-xl font-medium text-red-100">
              حدث خطأ ما في وضع التطوير
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              تفاصيل الخطأ:
            </h2>
            <div className="bg-red-50 p-6 rounded-lg mb-6" dir="ltr">
              <h3 className="text-lg font-semibold text-red-700 mb-2">
                {message}
              </h3>
              {stack && (
                <pre className="text-sm text-red-800 bg-red-100 p-4 rounded overflow-auto">
                  {stack}
                </pre>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onRetry}
                className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors"
              >
                حاول مرة أخرى
              </button>

              <Link
                href="/"
                className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
              >
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </div>
      ) : (
        // Show standard UI in production
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-red-500 p-6 text-center">
            <div className="text-6xl font-bold text-white mb-2">!عفوًا</div>
            <div className="text-xl font-medium text-red-100">حدث خطأ ما</div>
          </div>

          <div className="p-8 text-center">
            <div className="mx-auto bg-red-100 rounded-full w-24 h-24 flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              نحن نعتذر!
            </h2>
            <p className="text-gray-600 mb-6">
              حدث خطأ غير متوقع. تم إبلاغ فريقنا ونحن نعمل على إصلاحه.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onRetry}
                className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors"
              >
                حاول مرة أخرى
              </button>

              <Link
                href="/"
                className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
              >
                العودة للرئيسية
              </Link>
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-4 text-center">
            <p className="text-sm text-gray-500">
              هل تحتاج إلى مساعدة؟ تواصل مع الدعم عبر{" "}
              <a
                href="mailto:support@nafeesweb.com"
                className="text-red-500 hover:underline"
              >
                support@nafeesweb.com
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
