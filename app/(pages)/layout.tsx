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
    <div className="font-cairo flex h-screen bg-gray-50 overflow-hidden">
      <Suspense fallback={<div className="w-72 bg-slate-900" />}>
        <Sidebar />
      </Suspense>
      {/* Main Content */}
      <main className="flex-1 w-full h-screen flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <UserHeader />
        </div>
        <div className="flex-1 overflow-y-auto px-1.5 py-0.5">
          <Suspense fallback={<LoadingSkeleton />}>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}
