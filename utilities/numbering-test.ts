/**
 * ملف اختبار لآلية الترقيم الموحدة
 * يمكن تشغيل هذا الملف للتحقق من صحة آلية الترقيم
 */

import { 
  getNextInvoiceNumber, 
  getNextVoucherNumber, 
  getNextReceiptVoucherNumber,
  getNextPaymentVoucherNumber,
  getNextAdjustmentVoucherNumber,
  getNextSalesInvoiceNumber,
  getNextSalesReturnInvoiceNumber
} from './numbering';

/**
 * اختبار آلية الترقيم للفواتير
 */
export const testInvoiceNumbering = async () => {
  console.log('=== اختبار ترقيم الفواتير ===');
  
  try {
    // اختبار فواتير البيع
    const salesInvoiceNumber = await getNextSalesInvoiceNumber();
    console.log('رقم فاتورة البيع التالي:', salesInvoiceNumber);
    
    // اختبار مردودات البيع
    const salesReturnNumber = await getNextSalesReturnInvoiceNumber();
    console.log('رقم مردود البيع التالي:', salesReturnNumber);
    
    // اختبار فاتورة بيع عامة
    const generalInvoiceNumber = await getNextInvoiceNumber(2);
    console.log('رقم فاتورة بيع عامة:', generalInvoiceNumber);
    
    console.log('✅ اختبار ترقيم الفواتير مكتمل');
  } catch (error) {
    console.error('❌ خطأ في اختبار ترقيم الفواتير:', error);
  }
};

/**
 * اختبار آلية الترقيم للقيود والسندات
 */
export const testVoucherNumbering = async () => {
  console.log('=== اختبار ترقيم القيود والسندات ===');
  
  try {
    // اختبار سندات القبض
    const receiptNumber = await getNextReceiptVoucherNumber();
    console.log('رقم سند القبض التالي:', receiptNumber);
    
    // اختبار سندات الصرف
    const paymentNumber = await getNextPaymentVoucherNumber();
    console.log('رقم سند الصرف التالي:', paymentNumber);
    
    // اختبار قيود التسوية
    const adjustmentNumber = await getNextAdjustmentVoucherNumber();
    console.log('رقم قيد التسوية التالي:', adjustmentNumber);
    
    // اختبار قيد عام
    const generalVoucherNumber = await getNextVoucherNumber(3);
    console.log('رقم قيد عام (نوع 3):', generalVoucherNumber);
    
    console.log('✅ اختبار ترقيم القيود والسندات مكتمل');
  } catch (error) {
    console.error('❌ خطأ في اختبار ترقيم القيود والسندات:', error);
  }
};

/**
 * اختبار شامل لجميع أنواع الترقيم
 */
export const testAllNumbering = async () => {
  console.log('🚀 بدء الاختبار الشامل لآلية الترقيم الموحدة');
  console.log('=' .repeat(60));
  
  await testInvoiceNumbering();
  console.log('');
  await testVoucherNumbering();
  
  console.log('=' .repeat(60));
  console.log('🎉 انتهاء الاختبار الشامل');
};

/**
 * اختبار مقارنة مع البيانات الفعلية
 */
export const testWithRealData = async () => {
  console.log('=== اختبار مع البيانات الفعلية ===');
  
  try {
    // اختبار ترقيم الفواتير مع البيانات الفعلية
    const invoiceNumbers = [];
    for (let i = 0; i < 5; i++) {
      const number = await getNextSalesInvoiceNumber();
      invoiceNumbers.push(number);
      console.log(`الفواتير ${i + 1}: ${number}`);
    }
    
    // التحقق من عدم تكرار الأرقام
    const uniqueNumbers = new Set(invoiceNumbers);
    if (uniqueNumbers.size === invoiceNumbers.length) {
      console.log('✅ لا يوجد تكرار في أرقام الفواتير');
    } else {
      console.log('❌ يوجد تكرار في أرقام الفواتير');
    }
    
    // اختبار ترقيم السندات مع البيانات الفعلية
    const voucherNumbers = [];
    for (let i = 0; i < 5; i++) {
      const number = await getNextReceiptVoucherNumber();
      voucherNumbers.push(number);
      console.log(`السندات ${i + 1}: ${number}`);
    }
    
    // التحقق من عدم تكرار الأرقام
    const uniqueVoucherNumbers = new Set(voucherNumbers);
    if (uniqueVoucherNumbers.size === voucherNumbers.length) {
      console.log('✅ لا يوجد تكرار في أرقام السندات');
    } else {
      console.log('❌ يوجد تكرار في أرقام السندات');
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار البيانات الفعلية:', error);
  }
};

// تصدير الدوال للاستخدام في الاختبارات
export default {
  testInvoiceNumbering,
  testVoucherNumbering,
  testAllNumbering,
  testWithRealData
};
