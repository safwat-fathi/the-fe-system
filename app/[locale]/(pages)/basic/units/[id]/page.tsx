import { notFound } from "next/navigation";
import { Metadata } from "next";

import UnitFormClient from "../components/UnitFormClient";

import Breadcrumb from "@/components/Breadcrumb";
import unitService from "@/services/api/unit.service";

export const metadata: Metadata = {
  title: "عرض الوحدة - NafeesWeb",
  description: "عرض وتعديل بيانات الوحدة",
};

export default async function UnitDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const searchParamsData = await searchParams;
  const mode = Array.isArray(searchParamsData.mode)
    ? searchParamsData.mode[0]
    : searchParamsData.mode;

  // تحديد الوضع: preview (افتراضي) أو edit
  const formMode = mode === "edit" ? "edit" : "view";

  const unitId = parseInt(id);

  // التحقق من صحة المعرف
  if (isNaN(unitId) || unitId <= 0) {
    notFound();
  }

  // جلب بيانات الوحدة
  const unit = await unitService.getUnitById(unitId);

  if (!unit) {
    notFound();
  }

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "الوحدات", href: "/basic/units" },
          {
            name:
              formMode === "edit"
                ? `تعديل ${unit.unit_name || "الوحدة"}`
                : `عرض ${unit.unit_name || "الوحدة"}`,
          },
        ]}
      />
      <UnitFormClient initialUnit={unit} mode={formMode} />
    </div>
  );
}
