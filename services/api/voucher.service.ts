import { HttpService } from "@/services/base";
import { IParams } from "@/types/services/base";

export interface Voucher {
  vouch_id?: number;
  vouch_date: string;
  vouch_type: number;
  vouch_amt?: number;
  pay_type?: number;
  cr_date?: string;
  vouch_status?: number;
  vouch_notes?: string;
  ref_no?: string;
  acc_id?: number;
  cost_id?: number;
}

export interface VoucherDetail {
  dtl_id?: number;
  vouch_id?: number;
  acc_id?: number;
  acc_name?: string;
  cost_id?: number;
  cost_name?: string;
  debit?: number;
  credit?: number;
  debit_g?: number;
  credit_g?: number;
  tax?: number;
  tax_prc?: number;
  notes?: string;
  seq?: number;
}

export interface VoucherBox {
  box_id?: number;
  vouch_id?: number;
  box_no?: string;
  box_type?: number;
  gold_type?: number;
  weight?: number;
  notes?: string;
}

class VoucherService extends HttpService<Voucher> {
  constructor() {
    super(""); // Base URL من environment
  }

  /**
   * الحصول على جميع السندات
   */
  async getAll(params?: IParams) {
    return this.getList<Voucher[]>("vouchers_list", params);
  }

  /**
   * الحصول على سند معين
   */
  async getById(id: number) {
    return this.get<Voucher>(`vouchers_list`, { vouch_id: id });
  }

  /**
   * الحصول على السندات حسب النوع
   */
  async getByType(voucherType: number, params?: IParams) {
    return this.getList<Voucher[]>("vouchers_list", {
      ...params,
      vouch_type: voucherType,
    });
  }

  /**
   * إنشاء سند جديد
   */
  async create(voucher: Voucher) {
    return this.post<Voucher>("api_create_vouch", voucher);
  }

  /**
   * تحديث سند موجود
   */
  async update(id: number, voucher: Partial<Voucher>) {
    return this.put<Voucher>(`api_update_vouch/${id}`, voucher);
  }

  /**
   * حذف سند
   */
  async delete(id: number) {
    return this.delete<void>(`api_delete_vouch/${id}`);
  }

  // ====== تفاصيل السند (Voucher Details) ======

  /**
   * الحصول على تفاصيل سند معين
   */
  async getDetails(vouchId: number) {
    return this.getList<VoucherDetail[]>("vouchers_dtl_list", {
      vouch_id: vouchId,
    });
  }

  /**
   * الحصول على جميع تفاصيل السندات
   */
  async getAllDetails(params?: IParams) {
    return this.getList<VoucherDetail[]>("vouchers_dtl_list", params);
  }

  /**
   * إنشاء تفصيل سند جديد
   */
  async createDetail(detail: VoucherDetail) {
    return this.post<VoucherDetail>("api_create_vouch_dtl", detail);
  }

  /**
   * تحديث تفصيل سند
   */
  async updateDetail(id: number, detail: Partial<VoucherDetail>) {
    return this.put<VoucherDetail>(`api_update_vouch_dtl/${id}`, detail);
  }

  /**
   * حذف تفصيل سند
   */
  async deleteDetail(id: number) {
    return this.delete<void>(`api_delete_vouch_dtl/${id}`);
  }

  // ====== صناديق السند (Voucher Boxes) ======

  /**
   * الحصول على صناديق سند معين
   */
  async getBoxes(vouchId: number) {
    return this.getList<VoucherBox[]>("vouchers_box_list", {
      vouch_id: vouchId,
    });
  }

  /**
   * الحصول على جميع صناديق السندات
   */
  async getAllBoxes(params?: IParams) {
    return this.getList<VoucherBox[]>("vouchers_box_list", params);
  }

  /**
   * إنشاء صندوق سند جديد
   */
  async createBox(box: VoucherBox) {
    return this.post<VoucherBox>("api_create_vouch_box", box);
  }

  /**
   * تحديث صندوق سند
   */
  async updateBox(id: number, box: Partial<VoucherBox>) {
    return this.put<VoucherBox>(`api_update_vouch_box/${id}`, box);
  }

  /**
   * حذف صندوق سند
   */
  async deleteBox(id: number) {
    return this.delete<void>(`api_delete_vouch_box/${id}`);
  }

  // ====== القوائم المساعدة (Helper Lists) ======

  /**
   * الحصول على أنواع السندات
   */
  async getVoucherTypes() {
    return this.getList<any[]>("getVoucherTypeList");
  }

  /**
   * الحصول على حالات السندات
   */
  async getVoucherStages() {
    return this.getList<any[]>("getVoucherStageList");
  }

  // ====== دوال مساعدة ======

  /**
   * الحصول على رقم السند التالي
   */
  async getNextNumber(voucherType?: number) {
    const params: IParams = {};
    if (voucherType) {
      params.vouch_type = voucherType;
    }
    
    const response = await this.getAll(params);
    
    if (!response.success || !response.data || response.data.length === 0) {
      return 1;
    }

    const vouchers = response.data.filter((v: Voucher) => {
      const isValidType = !voucherType || v.vouch_type === voucherType;
      const hasValidId = v.vouch_id && v.vouch_id > 0;
      return isValidType && hasValidId;
    });

    if (vouchers.length === 0) {
      return 1;
    }

    const maxId = vouchers.reduce((max: number, curr: Voucher) => {
      return curr.vouch_id && curr.vouch_id > max ? curr.vouch_id : max;
    }, 0);

    return maxId + 1;
  }

  /**
   * حفظ سند كامل (السند + التفاصيل + الصناديق)
   */
  async saveComplete(
    voucher: Voucher,
    details: VoucherDetail[],
    boxes?: VoucherBox[]
  ) {
    try {
      // 1. حفظ السند الرئيسي
      const voucherResponse = voucher.vouch_id
        ? await this.update(voucher.vouch_id, voucher)
        : await this.create(voucher);

      if (!voucherResponse.success || !voucherResponse.data) {
        return voucherResponse;
      }

      const savedVoucher = voucherResponse.data;
      const vouchId = savedVoucher.vouch_id!;

      // 2. حفظ التفاصيل
      const detailPromises = details.map((detail) => {
        const detailWithVouchId = { ...detail, vouch_id: vouchId };
        return detail.dtl_id
          ? this.updateDetail(detail.dtl_id, detailWithVouchId)
          : this.createDetail(detailWithVouchId);
      });

      await Promise.all(detailPromises);

      // 3. حفظ الصناديق (إذا وجدت)
      if (boxes && boxes.length > 0) {
        const boxPromises = boxes.map((box) => {
          const boxWithVouchId = { ...box, vouch_id: vouchId };
          return box.box_id
            ? this.updateBox(box.box_id, boxWithVouchId)
            : this.createBox(boxWithVouchId);
        });

        await Promise.all(boxPromises);
      }

      return {
        success: true,
        data: savedVoucher,
        message: "تم حفظ السند بنجاح",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ",
      };
    }
  }
}

export default new VoucherService();

