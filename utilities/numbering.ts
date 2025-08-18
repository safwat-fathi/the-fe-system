import { fetchData } from './api';

export interface NumberingConfig {
  type: 'invoice' | 'voucher' | 'receipt_voucher' | 'payment_voucher' | 'adjustment_voucher';
  transType?: number; // نوع المعاملة (مثل 2 للبيع، 4 لمردود البيع، إلخ)
  voucherType?: number; // نوع القيد (مثل 1 لسند القبض، 3 لقيد تسوية، إلخ)
  endpoint: string; // نقطة النهاية لجلب البيانات
  idField: string; // اسم حقل المعرف (مثل inv_id, vouch_id)
  filterField?: string; // حقل التصفية (مثل trans_type, vouch_type)
}

/**
 * دالة موحدة لتوليد الرقم التالي لأي نوع من المستندات
 * تستخدم نفس منطق الفواتير مع إمكانية التخصيص
 */
export const getNextNumber = async (config: NumberingConfig): Promise<number> => {
  try {
    console.log(`=== الحصول على الرقم التالي لـ ${config.type} ===`);
    console.log('Config:', config);
    
    // بناء URL الاستعلام مع المعاملات
    let queryUrl = config.endpoint;
    const params = new URLSearchParams();
    
    if (config.filterField && config.transType) {
      params.append(config.filterField, config.transType.toString());
    } else if (config.filterField && config.voucherType) {
      params.append(config.filterField, config.voucherType.toString());
    }
    
    if (params.toString()) {
      queryUrl += `?${params.toString()}`;
    }
    
    console.log('Query URL:', queryUrl);
    
    const response = await fetchData<any[]>(queryUrl);
    
    if (!Array.isArray(response) || response.length === 0) {
      console.log(`لا توجد ${config.type} موجودة، البدء من 1`);
      return 1;
    }
    
    // تصفية البيانات حسب النوع إذا كان محدداً
    let filteredData = response;
    if (config.transType) {
      filteredData = response.filter((item: any) => {
        const isValidType = item.trans_type === config.transType;
        const hasValidId = item[config.idField] && isFinite(item[config.idField]) && item[config.idField] > 0;
        return isValidType && hasValidId;
      });
    } else if (config.voucherType) {
      filteredData = response.filter((item: any) => {
        const isValidType = item.vouch_type === config.voucherType;
        const hasValidId = item[config.idField] && isFinite(item[config.idField]) && item[config.idField] > 0;
        return isValidType && hasValidId;
      });
    } else {
      // إذا لم يكن هناك تصفية، تأكد من صحة المعرفات
      filteredData = response.filter((item: any) => {
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
 */
export const getNextInvoiceNumber = async (transType?: number): Promise<number> => {
  return getNextNumber({
    type: 'invoice',
    transType,
    endpoint: 'invoices_list',
    idField: 'inv_id',
    filterField: 'trans_type'
  });
};

/**
 * دالة مساعدة لتوليد رقم القيد التالي
 */
export const getNextVoucherNumber = async (voucherType?: number): Promise<number> => {
  return getNextNumber({
    type: 'voucher',
    voucherType,
    endpoint: 'vouchers_list',
    idField: 'vouch_id',
    filterField: 'vouch_type'
  });
};

/**
 * دالة مساعدة لتوليد رقم سند القبض التالي
 */
export const getNextReceiptVoucherNumber = async (): Promise<number> => {
  return getNextNumber({
    type: 'receipt_voucher',
    voucherType: 1, // سند قبض
    endpoint: 'vouchers_list',
    idField: 'vouch_id',
    filterField: 'vouch_type'
  });
};

/**
 * دالة مساعدة لتوليد رقم سند الصرف التالي
 */
export const getNextPaymentVoucherNumber = async (): Promise<number> => {
  return getNextNumber({
    type: 'payment_voucher',
    voucherType: 2, // سند صرف
    endpoint: 'vouchers_list',
    idField: 'vouch_id',
    filterField: 'vouch_type'
  });
};

/**
 * دالة مساعدة لتوليد رقم قيد التسوية التالي
 */
export const getNextAdjustmentVoucherNumber = async (): Promise<number> => {
  return getNextNumber({
    type: 'adjustment_voucher',
    voucherType: 3, // قيد تسوية
    endpoint: 'vouchers_list',
    idField: 'vouch_id',
    filterField: 'vouch_type'
  });
};

/**
 * دالة مساعدة لتوليد رقم فاتورة الشراء التالي
 */
export const getNextPurchaseInvoiceNumber = async (): Promise<number> => {
  return getNextInvoiceNumber(1); // 1 = شراء
};

/**
 * دالة مساعدة لتوليد رقم فاتورة البيع التالي
 */
export const getNextSalesInvoiceNumber = async (): Promise<number> => {
  return getNextInvoiceNumber(2); // 2 = بيع
};

/**
 * دالة مساعدة لتوليد رقم مردود الشراء التالي
 */
export const getNextPurchaseReturnInvoiceNumber = async (): Promise<number> => {
  return getNextInvoiceNumber(3); // 3 = مردود شراء
};

/**
 * دالة مساعدة لتوليد رقم مردود البيع التالي
 */
export const getNextSalesReturnInvoiceNumber = async (): Promise<number> => {
  return getNextInvoiceNumber(4); // 4 = مردود بيع
};

/**
 * دالة عامة لتوليد الرقم التالي لأي مستند مخصص
 * يمكن استخدامها للمستندات الجديدة في المستقبل
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
    endpoint,
    idField,
    filterField,
    ...(filterField === 'trans_type' && { transType: filterValue }),
    ...(filterField === 'vouch_type' && { voucherType: filterValue })
  };
  
  return getNextNumber(config);
};
