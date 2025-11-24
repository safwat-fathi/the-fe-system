"use client";

import { useState } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

import SystemsTree from "./SystemsTree";

export default function PermissionsMatrix() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <CardBody className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                مصفوفة الصلاحيات
              </h2>
              <p className="text-sm text-gray-600">
                عرض شامل لجميع الصلاحيات في النظام حسب الأنظمة والأقسام والشاشات
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Systems Tree */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner color="primary" size="lg" />
        </div>
      ) : (
        <SystemsTree />
      )}
    </div>
  );
}
