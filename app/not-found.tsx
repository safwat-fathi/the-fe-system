import Link from 'next/link';
import { Metadata } from 'next';
import BackButton from "../components/BackButton";

export const metadata: Metadata = {
  title: 'الصفحة غير موجودة - 404',
  description: 'عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.',
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="text-9xl font-bold text-primary-500 mb-4">404</div>
          <h1 className="text-3xl font-bold mb-2">الصفحة غير موجودة</h1>
          <p className="text-gray-600 mb-8">
            عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. قد تكون الصفحة
            قد تم حذفها أو نقلها.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn btn-primary w-full sm:w-auto">
            العودة إلى الصفحة الرئيسية
          </Link>
          <BackButton />
        </div>
      </div>
    </div>
  );
}
