import { Metadata } from "next";

import PermissionsClient from "./components/PermissionsClient";

export const metadata: Metadata = {
  title: "إدارة الصلاحيات - NafeesWeb",
  description: "إدارة صلاحيات المستخدمين والمجموعات",
};

export default async function PermissionsPage() {
  return (
    <div className="responsive-container font-cairo">
      <h1 className="responsive-text-xl font-bold mb-6">إدارة الصلاحيات</h1>

      <PermissionsClient />
    </div>
  );
}

