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
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { memo, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

import { onLogoutAction } from "@/app/actions/auth";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import Clock from "@/components/Clock";

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
};

interface UserHeaderProps {
  isAdmin?: boolean;
}

function UserHeader({ isAdmin }: UserHeaderProps) {
  const router = useRouter();
  const tUserHeader = useTranslations("layout.userHeader");

  const roleLabel = useMemo(() => {
    if (isAdmin) {
      return tUserHeader("adminRole");
    }

    return tUserHeader("defaultRole");
  }, [isAdmin, tUserHeader]);

  const handleLogout = useCallback(async () => {
    await onLogoutAction();
  }, []);

  const handleNavigateToTest = useCallback(() => {
    router.push("/test-service");
  }, [router]);

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
          <Clock />
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
                    {roleLabel}
                  </span>
                </div>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label={tUserHeader("menuLabel")}>
              <DropdownItem
                key="test"
                className="text-blue-600"
                startContent={<BeakerIcon className="w-4 h-4" />}
                onPress={handleNavigateToTest}
              >
                {tUserHeader("testPage")}
              </DropdownItem>
              <DropdownItem
                key="logout"
                className="text-red-600"
                startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                onPress={handleLogout}
              >
                {tUserHeader("logout")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}

export default memo(UserHeader);
