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
import { UserIcon } from "@heroicons/react/24/outline";
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
  const handleLogout = async () => {
    await onLogoutAction();
  };

  return (
    <Navbar className="bg-white shadow-sm border-b" maxWidth="full">
      <NavbarContent justify="end">
        {/* أيقونة المستخدم مع اسمه وقائمة منسدلة */}
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button variant="light" className="flex items-center gap-2 px-2">
                <Avatar
                  name={
                    STATIC_USER_INFO?.full_name || STATIC_USER_INFO?.username
                  }
                  size="sm"
                  className="bg-blue-100 text-blue-600"
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
