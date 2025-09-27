export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#1e293b] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">جاري التحقق من المصادقة...</p>
      </div>
    </div>
  );
}
