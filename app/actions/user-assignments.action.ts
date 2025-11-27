"use server";

import { getBranchParams } from "@/app/actions/branch-params";
import {
  revalidatePagePath,
  revalidateTableData,
} from "@/app/actions/revalidate.action";
import {
  userCompanyService,
  userCostCenterService,
  costCenterService,
  helperService,
  userService,
} from "@/services/api";
import { ServiceResponse } from "@/services/base/http.service";
import {
  SaveUserCompanyPayload,
  SaveUserCostCenterPayload,
  UserCompanyRecord,
  UserCostCenterRecord,
} from "@/types/models/user-company";

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

function normalizeArray<T>(value: ServiceResponse<T> | T | undefined): T[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if ((value as any)?.success !== undefined) {
    const response = value as ServiceResponse<any>;

    if (!response.success) {
      return [];
    }
    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray((data as any).results)) {
      return (data as any).results;
    }

    return [];
  }

  return [];
}

export async function loadUserAssignmentsAction(userId: number): Promise<
  ActionResult<{
    companies: UserCompanyRecord[];
    costCenters: UserCostCenterRecord[];
  }>
> {
  if (!userId) {
    return {
      success: true,
      data: {
        companies: [],
        costCenters: [],
      },
    };
  }

  try {
    const branchParams = await getBranchParams();
    const companyId = branchParams.com || "1";

    const [companies, costCenters] = await Promise.all([
      userCompanyService.list({
        xcom_id: companyId,
        xuser_id: userId,
      }),
      userCostCenterService.list({
        xcom_id: companyId,
        xuser_id: userId,
      }),
    ]);

    return {
      success: true,
      data: {
        companies,
        costCenters,
      },
    };
  } catch (error) {
    console.error("loadUserAssignmentsAction error:", error);

    return {
      success: false,
      error: "تعذر تحميل فروع ومراكز المستخدم، حاول مرة أخرى.",
    };
  }
}

async function persistUserCompany(
  payload: SaveUserCompanyPayload,
  recordId?: number,
) {
  if (recordId) {
    return userCompanyService.update(recordId, payload);
  }

  return userCompanyService.create(payload);
}

export async function saveUserCompanyAction({
  id,
  user,
  com,
}: {
  id?: number;
  user: number;
  com: number;
}): Promise<ActionResult<UserCompanyRecord | null>> {
  try {
    const response = await persistUserCompany(
      {
        user,
        com,
      },
      id,
    );

    if (!response.success) {
      throw new Error(response.message || "تعذر حفظ فرع المستخدم");
    }

    await revalidateTableData("user_companies");
    await revalidatePagePath("/settings/user-assignments");

    return {
      success: true,
      data: response.data as UserCompanyRecord,
    };
  } catch (error) {
    console.error("saveUserCompanyAction error:", error);

    return {
      success: false,
      error: "تعذر حفظ فرع المستخدم، حاول مرة أخرى.",
    };
  }
}

export async function deleteUserCompanyAction(
  id: number,
): Promise<ActionResult> {
  try {
    const response = await userCompanyService.remove(id);

    if (!response.success) {
      throw new Error(response.message || "تعذر حذف فرع المستخدم");
    }

    await revalidateTableData("user_companies");
    await revalidatePagePath("/settings/user-assignments");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("deleteUserCompanyAction error:", error);

    return {
      success: false,
      error: "تعذر حذف فرع المستخدم، حاول مرة أخرى.",
    };
  }
}

async function persistUserCostCenter(
  payload: SaveUserCostCenterPayload,
  recordId?: number,
) {
  if (recordId) {
    return userCostCenterService.update(recordId, payload);
  }

  return userCostCenterService.create(payload);
}

export async function saveUserCostCenterAction({
  id,
  user,
  cost,
}: {
  id?: number;
  user: number;
  cost: number;
}): Promise<ActionResult<UserCostCenterRecord | null>> {
  try {
    const response = await persistUserCostCenter(
      {
        user,
        cost,
      },
      id,
    );

    if (!response.success) {
      throw new Error(response.message || "تعذر حفظ مركز التكلفة");
    }

    await revalidateTableData("user_cost_centers");
    await revalidatePagePath("/settings/user-assignments");

    return {
      success: true,
      data: response.data as UserCostCenterRecord,
    };
  } catch (error) {
    console.error("saveUserCostCenterAction error:", error);

    return {
      success: false,
      error: "تعذر حفظ مركز التكلفة للمستخدم، حاول مرة أخرى.",
    };
  }
}

export async function deleteUserCostCenterAction(
  id: number,
): Promise<ActionResult> {
  try {
    const response = await userCostCenterService.remove(id);

    if (!response.success) {
      throw new Error(response.message || "تعذر حذف مركز التكلفة");
    }

    await revalidateTableData("user_cost_centers");
    await revalidatePagePath("/settings/user-assignments");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("deleteUserCostCenterAction error:", error);

    return {
      success: false,
      error: "تعذر حذف مركز التكلفة للمستخدم، حاول مرة أخرى.",
    };
  }
}

export async function loadUserAssignmentOptionsAction(): Promise<
  ActionResult<{
    users: any[];
    branches: any[];
    costCenters: any[];
  }>
> {
  try {
    const branchParams = await getBranchParams();
    const companyId = branchParams.com || "1";

    const [usersResponse, branchesResponse, costCentersResponse] =
      await Promise.all([
        userService.getAllUsers(),
        helperService.getBranches?.(companyId),
        costCenterService.getAllCostCenters(),
      ]);

    const users = normalizeArray(usersResponse);
    const branches = Array.isArray(branchesResponse)
      ? branchesResponse
      : normalizeArray(branchesResponse);
    const costCenters = Array.isArray(costCentersResponse)
      ? costCentersResponse
      : normalizeArray(costCentersResponse as any);

    return {
      success: true,
      data: {
        users,
        branches,
        costCenters,
      },
    };
  } catch (error) {
    console.error("loadUserAssignmentOptionsAction error:", error);

    return {
      success: false,
      error: "تعذر تحميل البيانات الأساسية، حاول مرة أخرى.",
    };
  }
}
