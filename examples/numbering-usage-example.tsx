"use client";

import { useState, useEffect } from "react";
import { Button, Input } from "@heroui/react";
import { Card, CardBody, CardHeader } from "@/components/Card";
import toast from "react-hot-toast";

// استيراد دوال الترقيم الموحدة
import {
  getNextInvoiceNumber,
  getNextVoucherNumber,
  getNextReceiptVoucherNumber,
  getNextPaymentVoucherNumber,
  getNextAdjustmentVoucherNumber,
  getNextCustomNumber,
  getNextSalesInvoiceNumber,
  getNextSalesReturnInvoiceNumber
} from "@/utilities/numbering";

/**
 * مثال على كيفية استخدام آلية الترقيم الموحدة في شاشة جديدة
 * يمكن استخدام هذا المثال كقالب للشاشات الجديدة
 */
export default function NumberingUsageExample() {
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<number>(0);
  const [nextVoucherNumber, setNextVoucherNumber] = useState<number>(0);
  const [nextReceiptNumber, setNextReceiptNumber] = useState<number>(0);
  const [nextPaymentNumber, setNextPaymentNumber] = useState<number>(0);
  const [nextAdjustmentNumber, setNextAdjustmentNumber] = useState<number>(0);
  const [customNumber, setCustomNumber] = useState<number>(0);

  // توليد الأرقام عند تحميل الصفحة
  useEffect(() => {
    generateAllNumbers();
  }, []);

  const generateAllNumbers = async () => {
    try {
      // توليد رقم فاتورة بيع جديدة
      const invoiceNumber = await getNextSalesInvoiceNumber();
      setNextInvoiceNumber(invoiceNumber);

      // توليد رقم قيد تسوية جديد
      const voucherNumber = await getNextVoucherNumber(3);
      setNextVoucherNumber(voucherNumber);

      // توليد رقم سند قبض جديد
      const receiptNumber = await getNextReceiptVoucherNumber();
      setNextReceiptNumber(receiptNumber);

      // توليد رقم سند صرف جديد
      const paymentNumber = await getNextPaymentVoucherNumber();
      setNextPaymentNumber(paymentNumber);

      // توليد رقم قيد تسوية جديد
      const adjustmentNumber = await getNextAdjustmentVoucherNumber();
      setNextAdjustmentNumber(adjustmentNumber);

      // مثال على استخدام الدالة المخصصة
      const custom = await getNextCustomNumber(
        'custom_document',
        'custom_endpoint',
        'custom_id',
        'custom_type',
        1
      );
      setCustomNumber(custom);

      toast.success("تم توليد جميع الأرقام بنجاح");
    } catch (error) {
      console.error("خطأ في توليد الأرقام:", error);
      toast.error("حدث خطأ في توليد الأرقام");
    }
  };

  const generateSpecificNumber = async (type: string) => {
    try {
      let number = 0;
      
      switch (type) {
        case 'invoice':
          number = await getNextInvoiceNumber(2); // فاتورة بيع
          break;
        case 'sales_return':
          number = await getNextSalesReturnInvoiceNumber();
          break;
        case 'voucher':
          number = await getNextVoucherNumber(3); // قيد تسوية
          break;
        case 'receipt':
          number = await getNextReceiptVoucherNumber();
          break;
        case 'payment':
          number = await getNextPaymentVoucherNumber();
          break;
        case 'adjustment':
          number = await getNextAdjustmentVoucherNumber();
          break;
        default:
          toast.error("نوع غير معروف");
          return;
      }
      
      toast.success(`تم توليد الرقم: ${number}`);
    } catch (error) {
      console.error("خطأ في توليد الرقم:", error);
      toast.error("حدث خطأ في توليد الرقم");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            مثال على استخدام آلية الترقيم الموحدة
          </h1>
          <p className="text-gray-600">
            هذا مثال يوضح كيفية استخدام آلية الترقيم الموحدة في الشاشات الجديدة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* الفواتير */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">الفواتير</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">رقم فاتورة البيع التالي:</span>
                <span className="font-bold text-blue-600">{nextInvoiceNumber}</span>
              </div>
              <Button
                color="primary"
                size="sm"
                onClick={() => generateSpecificNumber('invoice')}
              >
                توليد رقم فاتورة بيع
              </Button>
              <Button
                color="secondary"
                size="sm"
                onClick={() => generateSpecificNumber('sales_return')}
              >
                توليد رقم مردود بيع
              </Button>
            </CardBody>
          </Card>

          {/* القيود والسندات */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">القيود والسندات</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">قيد تسوية:</span>
                  <span className="font-bold text-green-600">{nextVoucherNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">سند قبض:</span>
                  <span className="font-bold text-purple-600">{nextReceiptNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">سند صرف:</span>
                  <span className="font-bold text-orange-600">{nextPaymentNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">قيد تسوية:</span>
                  <span className="font-bold text-red-600">{nextAdjustmentNumber}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  color="success"
                  size="sm"
                  onClick={() => generateSpecificNumber('receipt')}
                >
                  سند قبض
                </Button>
                <Button
                  color="warning"
                  size="sm"
                  onClick={() => generateSpecificNumber('payment')}
                >
                  سند صرف
                </Button>
                <Button
                  color="danger"
                  size="sm"
                  onClick={() => generateSpecificNumber('adjustment')}
                >
                  قيد تسوية
                </Button>
                <Button
                  color="primary"
                  size="sm"
                  onClick={() => generateSpecificNumber('voucher')}
                >
                  قيد عام
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* مستند مخصص */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">مستند مخصص</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">الرقم التالي:</span>
                <span className="font-bold text-indigo-600">{customNumber}</span>
              </div>
              <p className="text-sm text-gray-500">
                مثال على استخدام الدالة المخصصة للمستندات الجديدة
              </p>
            </CardBody>
          </Card>

          {/* إعادة توليد جميع الأرقام */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">إعادة التوليد</h2>
            </CardHeader>
            <CardBody>
              <Button
                color="primary"
                className="w-full"
                onClick={generateAllNumbers}
              >
                إعادة توليد جميع الأرقام
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* تعليمات الاستخدام */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">كيفية الاستخدام</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">1. استيراد الدوال:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import {
  getNextInvoiceNumber,
  getNextVoucherNumber,
  getNextReceiptVoucherNumber
} from "@/utilities/numbering";`}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">2. استخدام الدوال:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`// توليد رقم فاتورة بيع
const nextNumber = await getNextSalesInvoiceNumber();

// توليد رقم سند قبض
const receiptNumber = await getNextReceiptVoucherNumber();

// توليد رقم قيد تسوية
const voucherNumber = await getNextVoucherNumber(3);`}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">3. للشاشات الجديدة:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`// استخدام الدالة المخصصة
const customNumber = await getNextCustomNumber(
  'document_type',
  'api_endpoint',
  'id_field',
  'filter_field',
  filter_value
);`}
                </pre>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
