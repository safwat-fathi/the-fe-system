import { Metadata } from "next";

import UnitsClient from "./components/UnitsClient";

import Breadcrumb from "@/components/Breadcrumb";
import unitService from "@/services/api/unit.service";

export const metadata: Metadata = {
  title: "الوحدات - NafeesWeb",
  description: "إدارة الوحدات",
};

export default async function UnitsPage() {
  // جلب البيانات على السيرفر
  const unitsData = await unitService.getAllUnits().catch(() => []);

  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">الوحدات</h1>

      <UnitsClient initialUnits={unitsData} />
    </div>
  );
}
