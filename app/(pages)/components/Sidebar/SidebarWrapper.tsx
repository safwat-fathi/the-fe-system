import { Suspense } from "react";

import DynamicSidebar from "./DynamicSidebar";

import { menuService } from "@/services/api";

async function SidebarData() {
  const menuTree = await menuService.getActiveMenuTree();

  return <DynamicSidebar isLoading={false} menuTree={menuTree} />;
}

export default function SidebarWrapper() {
  return (
    <Suspense fallback={<DynamicSidebar isLoading={true} menuTree={[]} />}>
      <SidebarData />
    </Suspense>
  );
}
