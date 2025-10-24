import { voucherService } from "@/services/api";
import { invoiceService } from "@/services/api";

export interface NumberingConfig {
  type:
    | "invoice"
    | "voucher"
    | "receipt_voucher"
    | "payment_voucher"
    | "adjustment_voucher";
  transType?: number;
  voucherType?: number;
  idField: string;
}

/**
 * دالة موحدة لتوليد الرقم التالي لأي نوع من المستندات
 */
export const getNextNumber = async (
  config: NumberingConfig,
): Promise<number> => {
  try {
    let response;
    let data: any[] = [];

    if (config.type === "invoice") {
      // استخدام invoice service
      const params: any = {};

      if (config.transType) {
        params.trans_type = config.transType;
      }
      response = await invoiceService.getAll(params);
      if (response.success && response.data) {
        data = Array.isArray(response.data) ? response.data : [];
      }
    } else {
      // استخدام voucher service
      response = await voucherService.getAll();
      if (response.success && response.data) {
        data = Array.isArray(response.data) ? response.data : [];
      }
    }

    if (!data || data.length === 0) {
      return 1;
    }

    // تصفية البيانات حسب النوع
    let filteredData = data;

    if (config.transType !== undefined) {
      filteredData = data.filter((item: any) => {
        const isValidType = item.trans_type === config.transType;
        const hasValidId =
          item[config.idField] &&
          isFinite(item[config.idField]) &&
          item[config.idField] > 0;

        return isValidType && hasValidId;
      });
    } else if (config.voucherType !== undefined) {
      filteredData = data.filter((item: any) => {
        const isValidType = item.vouch_type === config.voucherType;
        const hasValidId =
          item[config.idField] &&
          isFinite(item[config.idField]) &&
          item[config.idField] > 0;

        return isValidType && hasValidId;
      });
    } else {
      filteredData = data.filter((item: any) => {
        return (
          item[config.idField] &&
          isFinite(item[config.idField]) &&
          item[config.idField] > 0
        );
      });
    }

    if (filteredData.length === 0) {
      return 1;
    }

    // البحث عن أكبر رقم
    const maxId = filteredData.reduce((max, curr) => {
      const currentId = curr[config.idField];

      return currentId > max ? currentId : max;
    }, 0);

    return maxId + 1;
  } catch (error) {
    console.error(`خطأ في الحصول على الرقم التالي:`, error);
    return 1;
  }
};

/**
 * دالة لتوليد رقم الفاتورة التالي
 */
export const getNextInvoiceNumber = async (
  transType?: number,
): Promise<number> => {
  return getNextNumber({
    type: "invoice",
    transType,
    idField: "inv_id",
  });
};

/**
 * دالة لتوليد رقم القيد التالي
 */
export const getNextVoucherNumber = async (
  voucherType?: number,
): Promise<number> => {
  return getNextNumber({
    type: "voucher",
    voucherType,
    idField: "vouch_id",
  });
};

/**
 * دالة لتوليد رقم سند القبض التالي
 */
export const getNextReceiptVoucherNumber = async (): Promise<number> => {
  return getNextNumber({
    type: "receipt_voucher",
    voucherType: 1,
    idField: "vouch_id",
  });
};

/**
 * دالة لتوليد رقم سند الصرف التالي
 */
export const getNextPaymentVoucherNumber = async (): Promise<number> => {
  return getNextNumber({
    type: "payment_voucher",
    voucherType: 2,
    idField: "vouch_id",
  });
};

/**
 * دالة لتوليد رقم قيد التسوية التالي
 */
export const getNextAdjustmentVoucherNumber = async (): Promise<number> => {
  return getNextNumber({
    type: "adjustment_voucher",
    voucherType: 3,
    idField: "vouch_id",
  });
};
