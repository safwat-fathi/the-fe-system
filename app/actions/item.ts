"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { getBranchParams } from "@/app/actions/branch-params";

export async function revalidateItemsDataAction() {
  try {
    const branchParams = await getBranchParams();
    const companyId = branchParams.com ?? "1";

    revalidateTag("items");
    revalidateTag(`items-company-${companyId}`);
    // إعادة التحقق من جميع صفحات الأصناف
    revalidatePath("/basic/items", "page");
    revalidatePath("/basic/items", "layout");
  } catch (error) {
    console.error("Error revalidating items data:", error);
    // لا نرمي الخطأ، فقط نطبع رسالة تحذير
  }
}
