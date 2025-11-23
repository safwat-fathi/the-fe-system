import { Metadata } from "next";

import IntegrationsClient from "./components/IntegrationsClient";

import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "خدمات الربط - NafeesWeb",
  description: "إدارة خدمات الربط الخارجية",
};

export default async function IntegrationsPage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <h1 className="responsive-text-xl font-bold mb-6">خدمات الربط</h1>

      <IntegrationsClient />
    </div>
  );
}
