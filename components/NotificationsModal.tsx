"use client";

import { useState, useEffect } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Badge,
  Divider
} from '@heroui/react';
import { 
  BellIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  isRead: boolean;
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'تحديث النظام',
      message: 'تم تحديث النظام إلى الإصدار الجديد بنجاح',
      type: 'success',
      timestamp: '2024-01-15 10:30',
      isRead: false
    },
    {
      id: 2,
      title: 'تنبيه الأمان',
      message: 'تم تسجيل الدخول من جهاز جديد',
      type: 'warning',
      timestamp: '2024-01-15 09:15',
      isRead: false
    },
    {
      id: 3,
      title: 'معلومات عامة',
      message: 'سيتم إجراء صيانة للنظام غداً من الساعة 2-4 صباحاً',
      type: 'info',
      timestamp: '2024-01-14 16:45',
      isRead: true
    }
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XMarkIcon className="w-5 h-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'danger';
      default:
        return 'primary';
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5" />
            <span>الإشعارات</span>
            {unreadCount > 0 && (
              <Badge color="danger" size="sm">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="light"
              onPress={markAllAsRead}
            >
              تحديد الكل كمقروء
            </Button>
          )}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BellIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className={`p-4 rounded-lg border ${
                    notification.isRead 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <Badge 
                                color={getNotificationColor(notification.type) as any}
                                size="sm"
                              >
                                جديد
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500">
                              {notification.timestamp}
                            </span>
                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <Button
                                  size="sm"
                                  variant="light"
                                  onPress={() => markAsRead(notification.id)}
                                  className="text-xs"
                                >
                                  تحديد كمقروء
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => deleteNotification(notification.id)}
                                className="text-xs"
                              >
                                حذف
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Divider />}
                </div>
              ))
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            إغلاق
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
