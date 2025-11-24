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
import {
  BeakerIcon,
  ClockIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { onLogoutAction } from "@/app/actions/auth";
import LocaleSwitcher from "@/components/LocaleSwitcher";

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
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "--/--/----";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const handleLogout = async () => {
    await onLogoutAction();
  };

  const handleNavigateToTest = () => {
    router.push("/test-service");
  };

  if (!isMounted) {
    return (
      <Navbar
        className="bg-gradient-to-r from-white via-slate-50 to-white shadow-sm border-b border-slate-200"
        classNames={{
          wrapper: "px-4 py-2 min-h-[48px]",
        }}
        maxWidth="full"
      >
        <NavbarContent className="hidden md:flex" justify="start">
          <NavbarItem>
            <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
          </NavbarItem>
        </NavbarContent>
      </Navbar>
    );
  }

  return (
    <Navbar
      className="bg-gradient-to-r from-white via-slate-50 to-white shadow-sm border-b border-slate-200"
      classNames={{
        wrapper: "px-4 py-2 min-h-[48px]",
      }}
      maxWidth="full"
    >
      <NavbarContent className="hidden md:flex" justify="start">
        <NavbarItem>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <span className="font-medium">{formatDate(currentTime)}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4 text-slate-400" />
              <span className="font-mono font-semibold text-slate-700">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <LocaleSwitcher />
        </NavbarItem>
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                className="flex items-center gap-2 px-2 py-1"
                variant="light"
              >
                <Avatar
                  className="bg-gradient-to-br from-amber-500 to-amber-600 text-white w-8 h-8 text-xs"
                  name={
                    STATIC_USER_INFO?.full_name || STATIC_USER_INFO?.username
                  }
                  size="sm"
                />
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-slate-700 leading-tight">
                    {STATIC_USER_INFO?.full_name || STATIC_USER_INFO?.username}
                  </span>
                  <span className="text-xs text-slate-500 leading-tight">
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
                onPress={handleNavigateToTest}
              >
                صفحة اختبار
              </DropdownItem>
              <DropdownItem
                key="logout"
                className="text-red-600"
                startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                onPress={handleLogout}
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
