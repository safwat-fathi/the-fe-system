import UserHeader from "@/components/UserHeader";
import Sidebar from "./components/Sidebar";

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
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
