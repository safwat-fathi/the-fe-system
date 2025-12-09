import type { MenuObject } from "@/types/models/menu";

import { Suspense } from "react";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";

import Sidebar from "./components/Sidebar";

import UserHeader from "@/components/UserHeader";
import { STORAGE_KEYS } from "@/constants";
import { objectsListService } from "@/services/api";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAdminCookie = cookieStore.get(STORAGE_KEYS.IS_ADMIN)?.value;
  const isAdmin = isAdminCookie === "true";
  const locale = await getLocale();
  let allowedObjectIds: number[] = [];
  let menuObjects: MenuObject[] = [];

  try {
    menuObjects = await objectsListService.getObjects(locale);
    allowedObjectIds = menuObjects.map((item) => item.id);
  } catch (error) {
    console.error("Failed to load allowed menu objects:", error);
  }

  return (
    <div className="font-cairo flex h-screen bg-gray-50 overflow-hidden">
      <Suspense fallback={<div className="w-72 bg-slate-900" />}>
        <Sidebar
          allowedObjectIds={allowedObjectIds}
          isAdmin={isAdmin}
          menuObjects={menuObjects}
        />
      </Suspense>
      {/* Main Content */}
      <main className="flex-1 w-full h-screen flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <UserHeader isAdmin={isAdmin} />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2" suppressHydrationWarning>
          {children}
        </div>
      </main>
    </div>
  );
}
