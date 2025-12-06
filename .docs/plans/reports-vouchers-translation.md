# خطة ترجمة تقرير السندات

## الملفات المطلوب تعديلها:

1. **ملفات الترجمة:**
   - `messages/ar.json` - إضافة قسم `reports.vouchers`
   - `messages/en.json` - إضافة قسم `reports.vouchers`

2. **ملفات المكونات:**
   - `app/[locale]/(pages)/reports/vouchers/page.tsx` - Server component
   - `app/[locale]/(pages)/reports/vouchers/components/VouchersReportClient.tsx` - Client component
   - `app/[locale]/(pages)/reports/vouchers/components/VouchersFilters.tsx` - Client component
   - `app/[locale]/(pages)/reports/vouchers/components/VouchersTable.tsx` - Client component
   - `app/[locale]/(pages)/reports/vouchers/components/VoucherTotals.tsx` - Client component
   - `app/[locale]/(pages)/reports/components/ReportsClient.tsx` - Client component (اسم التقرير في القائمة)

## النصوص المطلوب ترجمتها:

### صفحة الخادم (page.tsx):
- عنوان الصفحة: "تقرير السندات - NafeesWeb"
- وصف الصفحة: "تقرير شامل لجميع السندات"

### VouchersReportClient.tsx:
- العنوان الرئيسي: "تقرير السندات"
- أزرار التنقل: "السابق", "التالي"
- زر جديد: "سند جديد"
- علامات التبويب:
  - "جميع السندات"
  - "القيد الافتتاحي"
  - "سندات القبض"
  - "سندات الصرف"
  - "سندات القبض (عملاء)"
  - "سندات الصرف (عملاء)"
  - "قيود التسوية"
- aria-label: "أنواع السندات"
- رسائل الحذف: "هل أنت متأكد من حذف هذا السند؟", "حدث خطأ أثناء حذف السند"

### VouchersFilters.tsx:
- placeholder البحث: "البحث بالرقم أو البيان..."
- placeholder نوع السند: "نوع السند"
- placeholder من تاريخ: "من تاريخ"
- placeholder إلى تاريخ: "إلى تاريخ"
- زر مسح: "مسح الفلاتر"
- "جميع الأنواع"

### VouchersTable.tsx:
- أعمدة الجدول:
  - "رقم السند"
  - "التاريخ"
  - "نوع السند"
  - "المبلغ (نقدي)"
  - "الجرام (ذهب)"
  - "البيان"
  - "الحالة"
  - "إجراءات"
- حالات السند: "مفتوح", "مغلق", "غير محدد"
- tooltips: "عرض", "تعديل", "طباعة", "حذف"
- وحدة الجرام: "جم"

### VoucherTotals.tsx:
- "إجمالي السندات: {count} سند | إجمالي المبلغ: {amount} | إجمالي الجرام: {gold} جم"

### ReportsClient.tsx:
- اسم التقرير في القائمة: "تقرير السندات"

## البنية المقترحة للترجمة:

```json
{
  "reports": {
    "vouchers": {
      "title": "تقرير السندات",
      "description": "تقرير شامل لجميع السندات",
      "header": "تقرير السندات",
      "newVoucher": "سند جديد",
      "navigation": {
        "previous": "السابق",
        "next": "التالي"
      },
      "tabs": {
        "all": "جميع السندات",
        "opening": "القيد الافتتاحي",
        "receipt": "سندات القبض",
        "payment": "سندات الصرف",
        "customerReceipt": "سندات القبض (عملاء)",
        "customerPayment": "سندات الصرف (عملاء)",
        "adjustment": "قيود التسوية",
        "ariaLabel": "أنواع السندات"
      },
      "filters": {
        "searchPlaceholder": "البحث بالرقم أو البيان...",
        "voucherTypePlaceholder": "نوع السند",
        "fromDatePlaceholder": "من تاريخ",
        "toDatePlaceholder": "إلى تاريخ",
        "clearFilters": "مسح الفلاتر",
        "allTypes": "جميع الأنواع"
      },
      "table": {
        "columns": {
          "voucherNumber": "رقم السند",
          "date": "التاريخ",
          "voucherType": "نوع السند",
          "cashAmount": "المبلغ (نقدي)",
          "goldAmount": "الجرام (ذهب)",
          "notes": "البيان",
          "status": "الحالة",
          "actions": "إجراءات"
        },
        "status": {
          "open": "مفتوح",
          "closed": "مغلق",
          "undefined": "غير محدد"
        },
        "actions": {
          "view": "عرض",
          "edit": "تعديل",
          "print": "طباعة",
          "delete": "حذف"
        },
        "goldUnit": "جم"
      },
      "totals": {
        "summary": "إجمالي السندات: {count} سند | إجمالي المبلغ: {amount} | إجمالي الجرام: {gold} جم"
      },
      "messages": {
        "deleteConfirm": "هل أنت متأكد من حذف هذا السند؟",
        "deleteError": "حدث خطأ أثناء حذف السند"
      }
    }
  }
}
```
