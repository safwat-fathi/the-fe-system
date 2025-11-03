"use client";

import { Bars3Icon, HomeIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import MenuItem from "./MenuItem";

import LogoutButton from "@/components/LogoutButton";
import { MenuObject } from "@/types/models/menu";

interface DynamicSidebarProps {
  menuTree: MenuObject[];
  isLoading?: boolean;
}

export default function DynamicSidebar({
  menuTree,
  isLoading = false,
}: DynamicSidebarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  if (isLoading) {
    return (
      <aside className="bg-gradient-to-b from-gray-800 to-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col w-72 px-6 min-h-screen shadow-xl">
        <div className="flex items-center justify-center h-16 mb-8">
          <div className="animate-pulse">جاري التحميل...</div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`bg-gradient-to-b from-gray-800 to-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col ${
        isSidebarOpen ? "w-72 px-6" : "w-20 px-3"
      } min-h-screen shadow-xl`}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 mb-8 relative border-b border-gray-700 pb-4">
        {isSidebarOpen && (
          <h2 className="text-xl font-bold whitespace-nowrap text-white">
            لوحة التحكم
          </h2>
        )}
        <Button
          className="text-white hover:bg-gray-700"
          size="sm"
          variant="light"
          onPress={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Bars3Icon className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {/* Home Link */}
        <Link
          className={`flex items-center gap-4 p-3 rounded-xl transition-all text-white no-underline group ${
            pathname === "/"
              ? "bg-blue-600 shadow-lg"
              : "hover:bg-gray-700 hover:shadow-md"
          }`}
          href="/"
        >
          <div
            className={`text-lg ${
              pathname === "/"
                ? "text-white"
                : "text-gray-300 group-hover:text-white"
            }`}
          >
            <HomeIcon className="h-5 w-5" />
          </div>
          {isSidebarOpen && <span className="font-medium">الرئيسية</span>}
        </Link>

        {/* Dynamic Menu Items */}
        {menuTree.length > 0 ? (
          <div className="mt-6">
            {menuTree.map((item) => (
              <MenuItem
                isOpen={isSidebarOpen}
                item={item}
                key={item.id}
                pathname={pathname}
              />
            ))}
          </div>
        ) : (
          isSidebarOpen && (
            <div className="mt-6 text-sm text-gray-400 text-center">
              لا توجد عناصر متاحة
            </div>
          )
        )}

        {/* Logout Button */}
        <div className="mt-auto pt-6 border-t border-gray-700">
          <div className="flex justify-center">
            <LogoutButton />
          </div>
        </div>
      </nav>
    </aside>
  );
}
