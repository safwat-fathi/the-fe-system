import { Suspense } from "react";

import Sidebar from "./components/Sidebar";

import UserHeader from "@/components/UserHeader";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-cairo flex min-h-screen bg-gray-50">
      <Sidebar />
      {/* Main Content */}
      <main className="flex-1 w-full min-h-screen overflow-auto">
        <UserHeader />
        <div className="p-8">
          <Suspense fallback={<LoadingSkeleton />}>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}
