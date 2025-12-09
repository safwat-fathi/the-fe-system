import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import UserAssignmentsClient from "./components/UserAssignmentsClient";

import { loadUserAssignmentsAction } from "@/app/actions/user-assignments.action";
import { costCenterService, helperService, userService } from "@/services/api";
import { ServiceResponse } from "@/services/base/http.service";

type UserApiRecord = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
};

type BranchApiRecord = {
  id: number;
  com_name?: string;
  branch_name?: string;
  com_name_e?: string;
};

type CostCenterApiRecord = {
  id: number;
  cost_name?: string;
  cost_name_e?: string;
};

type Option = {
  id: number;
  label: string;
  helper?: string | null;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings.userAssignments");

  return {
    title: t("title"),
    description: t("description"),
  };
}

function extractResults<T>(payload: ServiceResponse<T> | any): T[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload?.success !== undefined) {
    if (!payload.success) {
      return [];
    }

    return extractResults<T>(payload.data);
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
}

function mapUsersToOptions(users: UserApiRecord[]) {
  return users
    .map((user) => {
      const id = Number(user.id);

      if (Number.isNaN(id)) {
        return null;
      }

      const fullName = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

      const label = fullName || user.username || `مستخدم ${id}`;

      return {
        id,
        label,
        helper: user.username,
      };
    })
    .filter((item) => item !== null)
    .sort((a, b) => a?.label.localeCompare(b.label, "ar"));
}

function mapBranchesToOptions(branches: BranchApiRecord[]): Option[] {
  return branches
    .map((branch) => {
      const rawId =
        branch.id ?? (branch as any).com ?? (branch as any).com_id ?? null;
      const id = Number(rawId);

      if (Number.isNaN(id)) {
        return null;
      }

      const label =
        branch.com_name ||
        branch.branch_name ||
        branch.com_name_e ||
        `فرع ${id}`;

      return {
        id,
        label,
      };
    })
    .filter((item): item is Option => item !== null)
    .sort((a, b) => a.label.localeCompare(b.label, "ar"));
}

function mapCostCentersToOptions(costCenters: CostCenterApiRecord[]): Option[] {
  return costCenters
    .map((costCenter) => {
      const id = Number(costCenter.id);

      if (Number.isNaN(id)) {
        return null;
      }

      const label =
        costCenter.cost_name || costCenter.cost_name_e || `مركز ${id}`;

      return {
        id,
        label,
      };
    })
    .filter((item): item is Option => item !== null)
    .sort((a, b) => a.label.localeCompare(b.label, "ar"));
}

export default async function UserAssignmentsPage() {
  const [usersResponse, branchesResponse, costCentersResponse] =
    await Promise.all([
      userService.getAllUsers(),
      helperService.getBranches(),
      costCenterService.getAllCostCenters(),
    ]);

  const users = mapUsersToOptions(extractResults<UserApiRecord>(usersResponse));

  const branches = mapBranchesToOptions(
    (Array.isArray(branchesResponse)
      ? branchesResponse
      : extractResults<BranchApiRecord>(branchesResponse)) ?? [],
  );

  const costCenters = mapCostCentersToOptions(
    (Array.isArray(costCentersResponse)
      ? costCentersResponse
      : extractResults<CostCenterApiRecord>(costCentersResponse)) ?? [],
  );

  const initialUserId = users[0]?.id ?? null;

  const initialAssignmentsResult = initialUserId
    ? await loadUserAssignmentsAction(initialUserId)
    : {
        success: true,
        data: {
          companies: [],
          costCenters: [],
        },
      };

  const initialAssignments = initialAssignmentsResult.success
    ? initialAssignmentsResult.data
    : {
        companies: [],
        costCenters: [],
      };

  const t = await getTranslations("settings.userAssignments");

  return (
    <div className="p-4 font-cairo space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          {t("labels.pageTitle")}
        </h1>
        <p className="text-gray-600 mt-1">{t("labels.pageDescription")}</p>
      </div>

      <UserAssignmentsClient
        branches={branches}
        costCenters={costCenters}
        initialAssignments={initialAssignments}
        initialUserId={initialUserId}
        users={users}
      />
    </div>
  );
}
