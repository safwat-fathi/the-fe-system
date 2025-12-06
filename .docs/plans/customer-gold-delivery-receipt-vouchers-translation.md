# خطة ترجمة شاشات سند قبض/صرف عميل والاستلام والتسليم

## الملفات المطلوب تعديلها:

1. **ملفات الترجمة:**
   - `messages/ar.json` - إضافة أقسام `forms.customerGoldVoucher`, `forms.deliveryVoucher`, `forms.receiptVoucher`
   - `messages/en.json` - إضافة نفس الأقسام

2. **ملفات المكونات:**
   - `app/[locale]/(pages)/forms/gvoucher4/CustomerGoldVoucherClientPage.tsx` - Client component
   - `app/[locale]/(pages)/forms/delivery/DeliveryVoucherClientPage.tsx` - Client component
   - `app/[locale]/(pages)/forms/receipt/ReceiptVoucherClientPage.tsx` - Client component

## النصوص المطلوب ترجمتها:

### مشترك بين جميع الشاشات:
- الأزرار: "حفظ", "تعديل", "جديد", "طباعة"
- الحقول: "رقم المرجع", "التاريخ والوقت", "البيان", "العميل", "مناولة", "مركز التكلفة"
- الحالات: "حُفظ", "مرحل", "طُبع"
- الرسائل: "جاري التحميل...", "جاري الترقيم...", "بحث برقم السند..."
- الجداول: "الذهب", "النقدية", "+ صف"
- الإجماليات: "إجمالي الذهب (القائم)", "إجمالي الذهب (المعاير)", "إجمالي النقدية"
- المودال: "توسيع البيان", "أدخل بيان القيد..."

### CustomerGoldVoucherClientPage:
- نوع السند: "سند قبض عميل", "سند صرف عميل"
- أعمدة جدول الذهب: "رقم الصنف", "الوزن القائم", "معايرة", "الوزن المعاير", "الصندوق", "البيان", "فرق عيار", "مبلغ التسكير", "وزن التسكير", "رقم الفاتورة", "مركز التكلفة", "حذف"
- أعمدة جدول النقدية: "المبلغ", "الصندوق", "البيان", "رقم الفاتورة", "مركز التكلفة", "حذف"
- Placeholders: "اختر العميل...", "مناولة", "اختر مركز التكلفة...", "اختر الصنف...", "اختر الصندوق...", "مركز التكلفة..."
- رسائل الخطأ: "يرجى اختيار العميل", "حدث خطأ أثناء الحفظ", "حدث خطأ أثناء البحث...", "لم يتم العثور على..."

### DeliveryVoucherClientPage:
- نوع السند: "سند تسليم"
- أعمدة جدول الذهب: "رقم الصنف", "الوزن القائم", "معايرة", "الوزن المعاير", "معدل الأجور", "الأجور", "الصندوق", "البيان", "فرق عيار", "مبلغ التسكير", "وزن التسكير", "رقم الفاتورة", "مركز التكلفة", "حذف"
- أعمدة جدول النقدية: "المبلغ", "الصندوق", "البيان", "رقم الفاتورة", "مركز التكلفة", "حذف"
- رسائل الخطأ: "لم يتم العثور على سند تسليم برقم: {number}"

### ReceiptVoucherClientPage:
- نوع السند: "سند استلام"
- أعمدة جدول الذهب: نفس DeliveryVoucherClientPage
- أعمدة جدول النقدية: نفس DeliveryVoucherClientPage
- رسائل الخطأ: "لم يتم العثور على سند استلام برقم: {number}"

## البنية المقترحة للترجمة:

```json
{
  "forms": {
    "customerGoldVoucher": {
      "title": {
        "receipt": "سند قبض عميل",
        "payment": "سند صرف عميل"
      },
      "fields": {
        "refNo": "رقم المرجع",
        "dateTime": "التاريخ والوقت",
        "notes": "البيان",
        "customer": "العميل",
        "handling": "مناولة",
        "costCenter": "مركز التكلفة"
      },
      "buttons": {
        "save": "حفظ",
        "edit": "تعديل",
        "new": "جديد",
        "print": "طباعة"
      },
      "status": {
        "saved": "حُفظ",
        "posted": "مرحل",
        "printed": "طُبع"
      },
      "messages": {
        "loading": "جاري التحميل...",
        "numbering": "جاري الترقيم...",
        "searchPlaceholder": "بحث برقم السند...",
        "selectCustomer": "يرجى اختيار العميل",
        "saveError": "حدث خطأ أثناء الحفظ",
        "searchError": "حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى",
        "notFound": "لم يتم العثور على {type} برقم: {number}"
      },
      "tables": {
        "gold": {
          "title": "الذهب",
          "addRow": "+ صف",
          "columns": {
            "itemNumber": "رقم الصنف",
            "weight": "الوزن القائم",
            "calibration": "معايرة",
            "calibratedWeight": "الوزن المعاير",
            "box": "الصندوق",
            "notes": "البيان",
            "caliberDifference": "فرق عيار",
            "sealingAmount": "مبلغ التسكير",
            "sealingWeight": "وزن التسكير",
            "invoiceNumber": "رقم الفاتورة",
            "costCenter": "مركز التكلفة",
            "delete": "حذف"
          },
          "placeholders": {
            "selectItem": "اختر الصنف...",
            "selectCostCenter": "مركز التكلفة..."
          }
        },
        "cash": {
          "title": "النقدية",
          "addRow": "+ صف",
          "columns": {
            "amount": "المبلغ",
            "box": "الصندوق",
            "notes": "البيان",
            "invoiceNumber": "رقم الفاتورة",
            "costCenter": "مركز التكلفة",
            "delete": "حذف"
          },
          "placeholders": {
            "selectBox": "اختر الصندوق...",
            "selectCostCenter": "مركز التكلفة..."
          }
        }
      },
      "totals": {
        "totalGoldStanding": "إجمالي الذهب (القائم)",
        "totalGoldCalibrated": "إجمالي الذهب (المعاير)",
        "totalCash": "إجمالي النقدية",
        "unit": "جم"
      },
      "modals": {
        "notes": {
          "title": "البيان",
          "placeholder": "أدخل بيان القيد...",
          "expandTitle": "توسيع البيان",
          "save": "حفظ"
        }
      },
      "placeholders": {
        "selectCustomer": "اختر العميل...",
        "handling": "مناولة",
        "selectCostCenter": "اختر مركز التكلفة...",
        "notesInput": "أدخل بيان القيد (انقر نقرتين للكتابة المطولة)"
      }
    },
    "deliveryVoucher": {
      "title": "سند تسليم",
      "messages": {
        "notFound": "لم يتم العثور على سند تسليم برقم: {number}"
      },
      "tables": {
        "gold": {
          "columns": {
            "wageRate": "معدل الأجور",
            "wages": "الأجور"
          }
        }
      }
    },
    "receiptVoucher": {
      "title": "سند استلام",
      "messages": {
        "notFound": "لم يتم العثور على سند استلام برقم: {number}"
      },
      "tables": {
        "gold": {
          "columns": {
            "wageRate": "معدل الأجور",
            "wages": "الأجور"
          }
        }
      }
    }
  }
}
```
