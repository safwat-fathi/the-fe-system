import { voucherService } from '@/services/api';
import { invoiceService } from '@/services/api';

export interface NumberingConfig {
  type: 'invoice' | 'voucher' | 'receipt_voucher' | 'payment_voucher' | 'adjustment_voucher';
  transType?: number; // نوع المعاملة (مثل 2 للبيع، 4 لمردود البيع، إلخ)
  voucherType?: number; // نوع القيد (مثل 1 لسند القبض، 3 لقيد تسوية، إلخ)
  idField: string; // اسم حقل المعرف (مثل inv_id, vouch_id)
}

/**
 * دالة موحدة لتوليد الرقم التالي لأي نوع من المستندات
 * تستخدم النظام الجديد من services/
 */
export const getNextNumber = async (config: NumberingConfig): Promise<number> => {
  try {
    console.log(`=== الحصول على الرقم التالي لـ ${config.type} ===`);
    console.log('Config:', config);
    
    let response;
    let data: any[] = [];

    // استخدام الـ service المناسب بناءً على النوع
    if (config.type === 'invoice') {
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
      response = await voucherService.getByType(config.voucherType || 0);
      if (response.success && response.data) {
        data = Array.isArray(response.data) ? response.data : [];
      }
    }
    
    if (!data || data.length === 0) {
      console.log(`لا توجد ${config.type} موجودة، البدء من 1`);
      return 1;
    }
    
    // تصفية البيانات حسب النوع إذا كان محدداً
    let filteredData = data;
    if (config.transType) {
      filteredData = data.filter((item: any) => {
        const isValidType = item.trans_type === config.transType;
        const hasValidId = item[config.idField] && isFinite(item[config.idField]) && item[config.idField] > 0;
        return isValidType && hasValidId;
      });
    } else if (config.voucherType) {
      filteredData = data.filter((item: any) => {
        const isValidType = item.vouch_type === config.voucherType;
        const hasValidId = item[config.idField] && isFinite(item[config.idField]) && item[config.idField] > 0;
        return isValidType && hasValidId;
      });
    } else {
      // إذا لم يكن هناك تصفية، تأكد من صحة المعرفات
      filteredData = data.filter((item: any) => {
        return item[config.idField] && isFinite(item[config.idField]) && item[config.idField] > 0;
      });
    }
    
    console.log(`عدد ${config.type} صالحة:`, filteredData.length);
    
    if (filteredData.length === 0) {
      console.log(`لا توجد ${config.type} صالحة، البدء من 1`);
      return 1;
    }
    
    // استخدام نفس منطق الفواتير: البحث عن أكبر رقم وإضافة 1
    const maxId = filteredData.reduce((max, curr) => {
      const currentId = curr[config.idField];
      return currentId > max ? currentId : max;
    }, 0);
    
    const nextId = maxId + 1;
    
    console.log(`أكبر معرف موجود: ${maxId}`);
    console.log(`الرقم التالي المحسوب: ${nextId}`);
    console.log(`=== انتهاء الحصول على الرقم التالي لـ ${config.type} ===`);
    
    return nextId;
  } catch (error) {
    console.error(`خطأ في الحصول على الرقم التالي لـ ${config.type}:`, error);
    // في حالة الخطأ، نبدأ من 1
    return 1;
  }
};

/**
 * دالة مساعدة لتوليد رقم الفاتورة التالي
 * @deprecated استخدم invoiceService.getNextNumber() مباشرة
 */
export const getNextInvoiceNumber = async (transType?: number): Promise<number> => {
  return getNextNumber({
    type: 'invoice',
    transType,
    idField: 'inv_id',
  });
};

/**
 * دالة مساعدة لتوليد رقم القيد التالي
 * @deprecated استخدم voucherService.getNextNumber() مباشرة
 */
export const getNextVoucherNumber = async (voucherType?: number): Promise<number> => {
  return getNextNumber({
    type: 'voucher',
    voucherType,
    idField: 'vouch_id',
  });
};

/**
 * دالة مساعدة لتوليد رقم سند القبض التالي
 * @deprecated استخدم voucherService.getNextNumber(1) مباشرة
 */
export const getNextReceiptVoucherNumber = async (): Promise<number> => {
  return getNextNumber({
    type: 'receipt_voucher',
    voucherType: 1, // سند قبض
    idField: 'vouch_id',
  });
};

/**
 * دالة مساعدة لتوليد رقم سند الصرف التالي
 * @deprecated استخدم voucherService.getNextNumber(2) مباشرة
 */
export const getNextPaymentVoucherNumber = async (): Promise<number> => {
  return getNextNumber({
    type: 'payment_voucher',
    voucherType: 2, // سند صرف
    idField: 'vouch_id',
  });
};

/**
 * دالة مساعدة لتوليد رقم قيد التسوية التالي
 * @deprecated استخدم voucherService.getNextNumber(3) مباشرة
 */
export const getNextAdjustmentVoucherNumber = async (): Promise<number> => {
  return getNextNumber({
    type: 'adjustment_voucher',
    voucherType: 3, // قيد تسوية
    idField: 'vouch_id',
  });
};

/**
 * دالة مساعدة لتوليد رقم فاتورة الشراء التالي
 * @deprecated استخدم invoiceService.getNextNumber() مباشرة
 */
export const getNextPurchaseInvoiceNumber = async (): Promise<number> => {
  return getNextInvoiceNumber(1); // 1 = شراء
};

/**
 * دالة مساعدة لتوليد رقم فاتورة البيع التالي
 * @deprecated استخدم invoiceService.getNextNumber() مباشرة
 */
export const getNextSalesInvoiceNumber = async (): Promise<number> => {
  return getNextInvoiceNumber(2); // 2 = بيع
};

/**
 * دالة مساعدة لتوليد رقم مردود الشراء التالي
 * @deprecated استخدم invoiceService.getNextNumber() مباشرة
 */
export const getNextPurchaseReturnInvoiceNumber = async (): Promise<number> => {
  return getNextInvoiceNumber(3); // 3 = مردود شراء
};

/**
 * دالة مساعدة لتوليد رقم مردود البيع التالي
 * @deprecated استخدم invoiceService.getNextNumber() مباشرة
 */
export const getNextSalesReturnInvoiceNumber = async (): Promise<number> => {
  return getNextInvoiceNumber(4); // 4 = مردود بيع
};

/**
 * دالة عامة لتوليد الرقم التالي لأي مستند مخصص
 * يمكن استخدامها للمستندات الجديدة في المستقبل
 * @deprecated استخدم الـ service المناسب مباشرة
 */
export const getNextCustomNumber = async (
  type: string,
  endpoint: string,
  idField: string,
  filterField?: string,
  filterValue?: number
): Promise<number> => {
  const config: NumberingConfig = {
    type: type as any,
    idField,
    ...(filterField === 'trans_type' && { transType: filterValue }),
    ...(filterField === 'vouch_type' && { voucherType: filterValue })
  };
  
  return getNextNumber(config);
};
