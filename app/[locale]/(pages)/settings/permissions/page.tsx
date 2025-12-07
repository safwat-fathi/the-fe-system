import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import PermissionsClient from "./components/PermissionsClient";

import Breadcrumb from "@/components/Breadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings.permissions");

  return {
    title: `${t("labels.pageTitle")} - NafeesWeb`,
    description: t("title"),
  };
}

export default async function PermissionsPage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <PermissionsClient />
    </div>
  );
}
