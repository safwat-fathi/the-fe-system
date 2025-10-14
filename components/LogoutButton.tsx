"use client";

import { Button } from "@heroui/react";
import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/outline";

import { onLogoutAction } from "@/app/actions/auth";

export default function LogoutButton() {
  const handleLogout = async () => {
    await onLogoutAction();
  };

  return (
    <Button
      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
      size="sm"
      startContent={<ArrowLeftStartOnRectangleIcon className="h-4 w-4" />}
      variant="light"
      onPress={handleLogout}
    >
      خروج
    </Button>
  );
}
