"use client";

import {
  Navbar,
  NavbarContent,
  NavbarItem,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import { UserIcon, BeakerIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { onLogoutAction } from "@/app/actions/auth";

interface UserInfo {
  username: string;
  full_name?: string;
  email?: string;
  role?: string;
}

const STATIC_USER_INFO: UserInfo = {
  username: "admin",
  full_name: "مدير النظام",
  email: "admin@example.com",
  role: "مدير",
};

export default function UserHeader() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--:--";
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "--/--/----";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleLogout = async () => {
    await onLogoutAction();
  };

  const handleNavigateToTest = () => {
    router.push("/test-service");
  };

  return (
    <Navbar className="bg-gradient-to-r from-white via-slate-50 to-white shadow-md border-b border-slate-200/50 backdrop-blur-sm" maxWidth="full">
      <NavbarContent justify="start" className="hidden md:flex">
        <NavbarItem>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="text-right">
              <div className="text-base font-semibold text-slate-800 font-mono tracking-wide">
                {formatDate(currentTime)} | {formatTime(currentTime)}
              </div>
            </div>
          </div>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        {/* أيقونة المستخدم مع اسمه وقائمة منسدلة */}
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button className="flex items-center gap-2 px-3 hover:bg-slate-100 rounded-full transition-all duration-200" variant="light">
                <Avatar
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm"
                  name={
                    STATIC_USER_INFO?.full_name || STATIC_USER_INFO?.username
                  }
                  size="sm"
                />
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-semibold text-slate-900">
                    {STATIC_USER_INFO?.full_name || STATIC_USER_INFO?.username}
                  </span>
                  <span className="text-xs text-slate-600">
                    {STATIC_USER_INFO?.role || "مستخدم"}
                  </span>
                </div>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="قائمة المستخدم">
              <DropdownItem
                key="test"
                className="text-blue-600"
                startContent={<BeakerIcon className="w-4 h-4" />}
                onClick={handleNavigateToTest}
              >
                صفحة اختبار
              </DropdownItem>
              <DropdownItem
                key="logout"
                className="text-red-600"
                startContent={<UserIcon className="w-4 h-4" />}
                onClick={handleLogout}
              >
                تسجيل الخروج
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
