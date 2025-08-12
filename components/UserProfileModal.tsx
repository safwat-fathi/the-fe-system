"use client";

import { useState, useEffect } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Input, 
  Avatar,
  Divider,
  Badge
} from '@heroui/react';
import { UserIcon, EnvelopeIcon, ShieldCheckIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { getAuthToken } from '@/utilities/api';
import toast from 'react-hot-toast';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  username: string;
  full_name: string;
  email: string;
  role: string;
  last_login?: string;
  created_at?: string;
  avatar?: string;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile>({
    username: 'admin',
    full_name: 'مدير النظام',
    email: 'admin@example.com',
    role: 'مدير',
    last_login: new Date().toLocaleDateString('ar-SA'),
    created_at: '2024-01-01'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        // يمكن إضافة API call لجلب معلومات المستخدم هنا
        // حالياً نستخدم البيانات الافتراضية
        setProfile({
          username: 'admin',
          full_name: 'مدير النظام',
          email: 'admin@example.com',
          role: 'مدير',
          last_login: new Date().toLocaleDateString('ar-SA'),
          created_at: '2024-01-01'
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل الملف الشخصي:', error);
      toast.error('فشل في تحميل معلومات الملف الشخصي');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // يمكن إضافة API call لحفظ التغييرات هنا
      await new Promise(resolve => setTimeout(resolve, 1000)); // محاكاة API call
      toast.success('تم حفظ التغييرات بنجاح');
      setIsEditing(false);
    } catch (error) {
      console.error('خطأ في حفظ التغييرات:', error);
      toast.error('فشل في حفظ التغييرات');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'مدير':
        return 'success';
      case 'محاسب':
        return 'primary';
      case 'مستخدم':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Avatar
              name={profile.full_name}
              size="lg"
              className="bg-blue-100 text-blue-600"
            />
            <div>
              <h3 className="text-lg font-semibold">الملف الشخصي</h3>
              <p className="text-sm text-gray-500">عرض وتعديل معلومات الحساب</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* معلومات أساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="اسم المستخدم"
                value={profile.username}
                isReadOnly={!isEditing}
                startContent={<UserIcon className="w-4 h-4 text-gray-400" />}
                variant="bordered"
              />
              <Input
                label="الاسم الكامل"
                value={profile.full_name}
                isReadOnly={!isEditing}
                startContent={<UserIcon className="w-4 h-4 text-gray-400" />}
                variant="bordered"
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
              />
              <Input
                label="البريد الإلكتروني"
                value={profile.email}
                isReadOnly={!isEditing}
                startContent={<EnvelopeIcon className="w-4 h-4 text-gray-400" />}
                variant="bordered"
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              />
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <label className="text-sm text-gray-600">الدور</label>
                  <div className="mt-1">
                    <Badge color={getRoleColor(profile.role) as any}>
                      {profile.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            {/* معلومات إضافية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <div>
                  <label className="text-sm text-gray-600">آخر تسجيل دخول</label>
                  <p className="text-sm font-medium">{profile.last_login}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <div>
                  <label className="text-sm text-gray-600">تاريخ إنشاء الحساب</label>
                  <p className="text-sm font-medium">{profile.created_at}</p>
                </div>
              </div>
            </div>

            {/* إعدادات الأمان */}
            {isEditing && (
              <>
                <Divider />
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">إعدادات الأمان</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="كلمة المرور الحالية"
                      type="password"
                      placeholder="أدخل كلمة المرور الحالية"
                      variant="bordered"
                    />
                    <Input
                      label="كلمة المرور الجديدة"
                      type="password"
                      placeholder="أدخل كلمة المرور الجديدة"
                      variant="bordered"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            إغلاق
          </Button>
          {isEditing ? (
            <>
              <Button variant="flat" onPress={() => setIsEditing(false)}>
                إلغاء
              </Button>
              <Button 
                color="primary" 
                onPress={handleSave}
                isLoading={isLoading}
              >
                حفظ التغييرات
              </Button>
            </>
          ) : (
            <Button color="primary" onPress={() => setIsEditing(true)}>
              تعديل الملف الشخصي
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
