import { HttpService } from "@/services/base";
import { IParams, IPaginatedResponse } from "@/types/services/base";

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
    super("");
  }

  /**
   * الحصول على جميع السندات (مع pagination)
   */
  async getAll(params?: IParams) {
    const queryParams: any = {
      xcom_id: "1", // الفرع ثابت = 1
      xyear_id: "0", // 0 = جميع السنوات (للقراءة)
      xvouch_type: params?.xvouch_type || params?.vouch_type || "0", // ✅ xvouch_type
      xvouch_id: params?.xvouch_id || "0", // ✅ إضافة
      xfrom_date: params?.xfrom_date || "0", // ✅ إضافة
      xto_date: params?.xto_date || "0", // ✅ إضافة
      page: params?.page || "1", // pagination
    };

    const response = await this.get<IPaginatedResponse<Voucher>>(
      "vouchers_list",
      queryParams,
    );

    // معالجة الاستجابة المُقسّمة (pagination)
    if (response.success && response.data) {
      const data = response.data as any;

      // إذا كانت الاستجابة تحتوي على results (pagination)
      if (data.results && Array.isArray(data.results)) {
        return {
          success: true,
          data: data.results,
          message: response.message,
        };
      }

      // إذا كانت array مباشرة
      if (Array.isArray(data)) {
        return {
          success: true,
          data: data,
          message: response.message,
        };
      }
    }

    return {
      success: false,
      data: [],
      message: response.message || "لم يتم العثور على قيود",
    };
  }

  /**
   * الحصول على السندات حسب النوع
   */
  async getByType(voucherType: number, params?: IParams) {
    return this.getAll({ ...params, xvouch_type: voucherType });
  }

  /**
   * إنشاء سند جديد
   */
  async create(voucher: any) {
    return this.post<Voucher>("api_create_vouch", voucher);
  }

  /**
   * تحديث سند موجود
   */
  async update(id: number, voucher: any) {
    return this.put<Voucher>(`api_update_vouch/${id}`, voucher);
  }

  /**
   * حذف سند
   */
  async delete(id: number) {
    return this.delete<void>(`api_delete_vouch/${id}`);
  }

  // ====== تفاصيل السند ======

  /**
   * الحصول على تفاصيل سند معين
   */
  async getDetails(vouchId: number, params?: IParams) {
    const queryParams = {
      vouch_id: vouchId,
      xcom_id: "1",
      xyear_id: "0", // 0 = جميع السنوات (للقراءة)
    };

    return this.getList<VoucherDetail[]>("vouchers_dtl_list", queryParams);
  }

  /**
   * إنشاء تفصيل سند جديد
   */
  async createDetail(detail: any) {
    return this.post<VoucherDetail>("api_create_vouch_dtl", detail);
  }

  /**
   * تحديث تفصيل سند
   */
  async updateDetail(id: number, detail: any) {
    return this.put<VoucherDetail>(`api_update_vouch_dtl/${id}`, detail);
  }

  /**
   * حذف تفصيل سند
   */
  async deleteDetail(id: number) {
    return this.delete<void>(`api_delete_vouch_dtl/${id}`);
  }

  // ====== صناديق السند ======

  /**
   * الحصول على صناديق سند معين
   */
  async getBoxes(vouchId: number) {
    return this.getList<VoucherBox[]>("vouchers_box_list", {
      vouch_id: vouchId,
    });
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

  // ====== القوائم المساعدة ======

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

  /**
   * الحصول على رقم السند التالي لنوع معين
   */
  async getNextNumber(voucherType: number = 3) {
    try {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🔢 طلب رقم قيد جديد - النوع:", voucherType);

      // جلب جميع السندات
      const response = await this.getAll();

      if (!response.success || !response.data || response.data.length === 0) {
        console.log("⚠️ لا توجد قيود، البدء من 1");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        return 1;
      }

      console.log("📥 إجمالي القيود المُستلمة:", response.data.length);

      // فلترة السندات حسب النوع
      const vouchers = response.data.filter(
        (v: any) =>
          Number(v.vouch_type) === Number(voucherType) &&
          v.vouch_id &&
          v.vouch_id > 0 &&
          isFinite(v.vouch_id),
      );

      console.log(`🔍 عدد القيود من النوع ${voucherType}:`, vouchers.length);

      if (vouchers.length > 0) {
        console.log(
          "📋 القيود المفلترة:",
          vouchers.map((v: any) => ({
            id: v.id,
            vouch_id: v.vouch_id,
            vouch_type: v.vouch_type,
          })),
        );
      }

      if (vouchers.length === 0) {
        console.log(`⚠️ لا توجد قيود من النوع ${voucherType}، البدء من 1`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        return 1;
      }

      // الحصول على أكبر رقم
      const maxId = vouchers.reduce((max: number, curr: any) => {
        return curr.vouch_id > max ? curr.vouch_id : max;
      }, 0);

      const nextId = maxId + 1;

      console.log("📊 أكبر vouch_id من النوع", voucherType, "=", maxId);
      console.log("✅ الرقم التالي =", nextId);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      return nextId;
    } catch (error) {
      console.error("❌ خطأ في الحصول على رقم القيد:", error);
      return 1;
    }
  }
}

export default new VoucherService();
