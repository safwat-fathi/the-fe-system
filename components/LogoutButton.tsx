"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import { ArrowLeftStartOnRectangleIcon } from '@heroicons/react/24/outline';
import { removeAuthToken } from '@/utilities/api';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    removeAuthToken();
    router.push('/');
  };

  return (
    <Button
      size="sm"
      variant="light"
      onPress={handleLogout}
      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
      startContent={<ArrowLeftStartOnRectangleIcon className="h-4 w-4" />}
    >
      خروج
    </Button>
  );
}
