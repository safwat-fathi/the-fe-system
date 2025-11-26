"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Input,
} from "@heroui/react";
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { Group } from "../../types/groups";
import { SYSTEM_MAP } from "../../utils/system-map";
import { PERMISSION_TYPES } from "../../types/permissions";
import { getPermissionLabel } from "../../utils/permission-formatters";
import { groupService } from "../../services/index";
import BulkPermissions from "../PermissionsMatrix/BulkPermissions";
import CopyPermissions from "../Shared/CopyPermissions";

import QuickPermissionActions from "./QuickPermissionActions";
import PermissionsTree from "./PermissionsTree";

interface GroupPermissionsProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GroupPermissions({
  group,
  isOpen,
  onClose,
  onSuccess,
}: GroupPermissionsProps) {
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedScreens, setSelectedScreens] = useState<Set<string>>(
    new Set(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  useEffect(() => {
    if (isOpen && group) {
      loadPermissions();
    }
  }, [isOpen, group]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const groupPermissions = await groupService.getPermissions(group.id);

      // Convert to format: { screenId: [permissions] }
      const formatted: Record<string, string[]> = {};

      groupPermissions.forEach((perm: any) => {
        formatted[perm.object_id || perm.screen_id] = perm.permissions || [];
      });

      setPermissions(formatted);
    } catch (error) {
      console.error("Error loading permissions:", error);
      toast.error("حدث خطأ أثناء جلب الصلاحيات");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (screenId: string, permission: string) => {
    setPermissions((prev) => {
      const current = prev[screenId] || [];
      const updated = current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission];

      return {
        ...prev,
        [screenId]: updated,
      };
    });
  };

  const toggleAllPermissions = (screenId: string, checked: boolean) => {
    setPermissions((prev) => {
      if (checked) {
        return {
          ...prev,
          [screenId]: Object.values(PERMISSION_TYPES),
        };
      } else {
        const updated = { ...prev };

        delete updated[screenId];

        return updated;
      }
    });
  };

  const selectAllScreens = () => {
    const allScreenIds = new Set<string>();

    SYSTEM_MAP.systems.forEach((system) => {
      system.sections.forEach((section) => {
        section.screens.forEach((screen) => {
          if (
            !searchTerm ||
            screen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            screen.path?.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            allScreenIds.add(screen.id);
          }
        });
      });
    });
    setSelectedScreens(allScreenIds);
  };

  const clearSelection = () => {
    setSelectedScreens(new Set());
  };

  const handleBulkApply = (newPermissions: Record<string, string[]>) => {
    setPermissions((prev) => ({
      ...prev,
      ...newPermissions,
    }));
    setSelectedScreens(new Set());
    toast.success("تم تطبيق الصلاحيات المجمعة");
  };

  const handleQuickApplyPermission = (permission: string) => {
    const newPermissions: Record<string, string[]> = {};

    selectedScreens.forEach((screenId) => {
      const current = permissions[screenId] || [];

      if (!current.includes(permission)) {
        newPermissions[screenId] = [...current, permission];
      }
    });

    setPermissions((prev) => ({
      ...prev,
      ...newPermissions,
    }));

    toast.success(
      `تم تطبيق صلاحية "${getPermissionLabel(permission)}" على ${selectedScreens.size} شاشة`,
    );
  };

  const handleQuickApplyAll = () => {
    const allPermissions = Object.values(PERMISSION_TYPES);
    const newPermissions: Record<string, string[]> = {};

    selectedScreens.forEach((screenId) => {
      newPermissions[screenId] = [...allPermissions];
    });

    setPermissions((prev) => ({
      ...prev,
      ...newPermissions,
    }));

    toast.success(`تم تطبيق جميع الصلاحيات على ${selectedScreens.size} شاشة`);
    setSelectedScreens(new Set());
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Convert permissions to API format
      const permissionsArray = Object.entries(permissions).map(
        ([screenId, perms]) => ({
          object_id: parseInt(screenId),
          screen_id: screenId,
          permissions: perms,
        }),
      );

      await groupService.updatePermissions(group.id, permissionsArray);

      toast.success("تم حفظ الصلاحيات بنجاح");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("حدث خطأ أثناء حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalBody>
            <div className="flex justify-center items-center py-20">
              <Spinner color="primary" size="lg" />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-bold">
                صلاحيات المجموعة: {group.name}
              </h3>
              <p className="text-sm text-gray-500 font-normal">
                حدد الصلاحيات المسموحة لهذه المجموعة لكل شاشة
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Search and Bulk Actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Input
                  className="flex-1"
                  placeholder="ابحث عن شاشة..."
                  startContent={
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  }
                  value={searchTerm}
                  variant="bordered"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex gap-2">
                  {selectedScreens.size === 0 && (
                    <>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={selectAllScreens}
                      >
                        تحديد الكل
                      </Button>
                      <Button
                        color="secondary"
                        size="sm"
                        startContent={
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        }
                        variant="flat"
                        onPress={() => setShowCopyModal(true)}
                      >
                        نسخ من مجموعة
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Actions for Selected Screens */}
              {selectedScreens.size > 0 && (
                <QuickPermissionActions
                  selectedScreens={Array.from(selectedScreens)}
                  onApplyAll={handleQuickApplyAll}
                  onApplyPermission={handleQuickApplyPermission}
                  onClearAll={clearSelection}
                />
              )}
            </div>

            {/* Permissions Tree */}
            <PermissionsTree
              permissions={permissions}
              onPermissionChange={togglePermission}
              onSelectAll={toggleAllPermissions}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            إلغاء
          </Button>
          <Button color="primary" isLoading={saving} onPress={handleSave}>
            حفظ الصلاحيات
          </Button>
        </ModalFooter>
      </ModalContent>

      {/* Bulk Permissions Modal */}
      {showBulkModal && (
        <BulkPermissions
          currentPermissions={permissions}
          selectedScreens={Array.from(selectedScreens)}
          onApply={handleBulkApply}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      {/* Copy Permissions Modal */}
      {showCopyModal && (
        <CopyPermissions
          isOpen={showCopyModal}
          sourceId={group.id}
          sourceType="group"
          targetType="group"
          onClose={() => setShowCopyModal(false)}
          onSuccess={() => {
            loadPermissions();
            setShowCopyModal(false);
          }}
        />
      )}
    </Modal>
  );
}
