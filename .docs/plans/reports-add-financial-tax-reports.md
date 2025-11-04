# إضافة التقارير المالية والضريبية

## الهدف
تفعيل التقارير المالية المطلوبة وإضافة قسم التقارير الضريبية بشكل منفصل مع الحفاظ على نفس التصميم والتنسيق.

## التقارير المالية المطلوبة (تفعيل)
1. **ميزان المراجعة** (Trial Balance) - `/reports/trial-balance`
2. **الميزانية العمومية** (Balance Sheet) - `/reports/balance-sheet`
3. **دفتر القيود** (Journal Ledger) - `/reports/journal-ledger`
4. **دفتر الأستاذ** (General Ledger) - `/reports/general-ledger`

## قسم التقارير الضريبية (جديد)
إضافة قسم منفصل يحتوي على:
1. **تقرير فواتير المبيعات الضريبية** (Tax Sales Invoices Report) - `/reports/tax/sales-invoices`
2. **تقرير فواتير المشتريات الضريبية** (Tax Purchase Invoices Report) - `/reports/tax/purchase-invoices`
3. **تقرير الإشعارات الدائنة الضريبية** (Tax Credit Notes Report) - `/reports/tax/credit-notes`
4. **تقرير الإشعارات المدينة الضريبية** (Tax Debit Notes Report) - `/reports/tax/debit-notes`
5. **دفتر اليومية الضريبية** (Tax Daily Journal) - `/reports/tax/daily-journal` - جديد
6. **نموذج الإقرار الضريبي** (Tax Declaration Form) - `/reports/tax/declaration` - قد يكون مرتبط بـ VAT

## المهام
1. تحديث `ReportsClient.tsx` لإضافة قسم الضريبة
2. تفعيل التقارير المالية (تغيير status من locked إلى available)
3. إنشاء صفحات التقارير المالية مع نفس التصميم
4. إنشاء صفحات التقارير الضريبية مع نفس التصميم
5. التأكد من إضافة Breadcrumb في جميع الصفحات

## التصميم
- الحفاظ على نفس التصميم الموجود في التقارير الحالية
- استخدام نفس الألوان والخطوط
- نفس بنية الـ filters والجداول
- نفس بنية الـ headers والتنسيق
