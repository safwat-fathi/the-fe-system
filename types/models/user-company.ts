export type UserCompanyRecord = {
  id: number;
  user: number;
  com: number;
  branch_name?: string | null;
  branch_code?: string | null;
};

export type UserCostCenterRecord = {
  id: number;
  user: number;
  cost: number;
  cost_name?: string | null;
  cost_code?: string | null;
};

export type SaveUserCompanyPayload = {
  user: number;
  com: number;
};

export type SaveUserCostCenterPayload = {
  user: number;
  cost: number;
};

