import { Metadata } from "next";

import UnitFormClient from "../components/UnitFormClient";

import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "إضافة وحدة جديدة - NafeesWeb",
  description: "إضافة وحدة جديدة إلى النظام",
};

export default async function NewUnitPage() {
  // إنشاء وحدة فارغة
  const emptyUnit = {
    id: 0,
    unit_name: "",
    unit_name_e: "",
    unit_type: 0,
    unit_status: true,
    unit_default: false,
  };

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb
        items={[
          { name: "الوحدات", href: "/basic/units" },
          { name: "إضافة وحدة جديدة" },
        ]}
      />
      <UnitFormClient initialUnit={emptyUnit} mode="add" />
    </div>
  );
}
