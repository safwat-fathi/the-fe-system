import type { Voucher } from "@/types/voucher";

import { HttpService } from "@/services/base";

class AdjustmentVoucherService extends HttpService<Voucher> {
  constructor() {
    super("");
  }

  async getById(id: number | string) {
    const comId = await this._getCompanyId();
    const branchParam = comId ? String(comId) : "1";

    const queryParams = {
      xcom_id: branchParam,
      xyear_id: "0",
      xvouch_type: "3",
      xvouch_id: id,
      xfrom_date: "0",
      xto_date: "0",
      page: "1",
    };

    return this.getPaginated<Voucher>("vouchers_list", queryParams);
  }
}

export const adjustmentVoucherService = new AdjustmentVoucherService();
