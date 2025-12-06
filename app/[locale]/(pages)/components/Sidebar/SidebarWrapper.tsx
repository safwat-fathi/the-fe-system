import { Suspense } from "react";
import { getLocale } from "next-intl/server";

import DynamicSidebar from "./DynamicSidebar";

import { objectsListService } from "@/services/api";
import { buildMenuTree } from "@/utilities/menu";

async function SidebarData() {
  const locale = await getLocale();
  const objects = await objectsListService.getObjects(locale);
  const activeObjects = objects.filter((obj) => obj.is_active);
  const menuTree = buildMenuTree(activeObjects);

  return <DynamicSidebar isLoading={false} menuTree={menuTree} />;
}

export default function SidebarWrapper() {
  return (
    <Suspense fallback={<DynamicSidebar isLoading={true} menuTree={[]} />}>
      <SidebarData />
    </Suspense>
  );
}
