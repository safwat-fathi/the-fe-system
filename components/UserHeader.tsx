"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { 
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem, 
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button
} from '@heroui/react';
import { 
  UserIcon
} from '@heroicons/react/24/outline';
import { isAuthenticated, getAuthToken, removeAuthToken } from '@/utilities/api';



interface UserInfo {
  username: string;
  full_name?: string;
  email?: string;
  role?: string;
}

export default function UserHeader() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const checkAuthAndUserInfo = async () => {
      if (isAuthenticated()) {
        try {
          // محاولة جلب معلومات المستخدم من التوكن
          const token = getAuthToken();
          if (token) {
            // يمكن إضافة API call لجلب معلومات المستخدم هنا
            // حالياً سنستخدم معلومات افتراضية
            setUserInfo({
              username: 'admin',
              full_name: 'مدير النظام',
              email: 'admin@example.com',
              role: 'مدير'
            });
          }
        } catch (error) {
          console.error('خطأ في جلب معلومات المستخدم:', error);
        }
      }
      setIsLoading(false);
    };

    checkAuthAndUserInfo();
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    router.push('/');
  };





  if (isLoading) {
    return (
      <Navbar className="bg-white shadow-sm border-b">
        <NavbarBrand>
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </NavbarBrand>
      </Navbar>
    );
  }

  if (!isAuthenticated()) {
    return null; // لا تظهر Header إذا لم يكن المستخدم مسجل دخول
  }

  return (
    <Navbar className="bg-white shadow-sm border-b" maxWidth="full">


      <NavbarContent justify="end">
        {/* أيقونة المستخدم مع اسمه وقائمة منسدلة */}
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                variant="light"
                className="flex items-center gap-2 px-2"
              >
                <Avatar
                  name={userInfo?.full_name || userInfo?.username}
                  size="sm"
                  className="bg-blue-100 text-blue-600"
                />
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900">
                    {userInfo?.full_name || userInfo?.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {userInfo?.role || 'مستخدم'}
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
