import { Metadata } from "next";

import PermissionsClient from "./components/PermissionsClient";

import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "إدارة الصلاحيات - NafeesWeb",
  description: "إدارة صلاحيات المستخدمين والمجموعات",
};

export default async function PermissionsPage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <PermissionsClient />
    </div>
  );
}
