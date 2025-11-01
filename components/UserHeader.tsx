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

  const handleLogout = async () => {
    await onLogoutAction();
  };

  const handleNavigateToTest = () => {
    router.push("/test-service");
  };

  return (
    <Navbar className="bg-white shadow-sm border-b" maxWidth="full">
      <NavbarContent justify="end">
        {/* أيقونة المستخدم مع اسمه وقائمة منسدلة */}
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button className="flex items-center gap-2 px-2" variant="light">
                <Avatar
                  className="bg-blue-100 text-blue-600"
                  name={
                    STATIC_USER_INFO?.full_name || STATIC_USER_INFO?.username
                  }
                  size="sm"
                />
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900">
                    {STATIC_USER_INFO?.full_name || STATIC_USER_INFO?.username}
                  </span>
                  <span className="text-xs text-gray-500">
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
