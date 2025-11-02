# خطة تنفيذ: إضافة xcom_id للحسابات + شاشة الضرائب + تقرير قائمة الدخل

## المهام

### 1. إضافة xcom_id لاستدعاءات الحسابات
- تحديث `account.service.ts` - `getAllAccounts()` لإضافة `xcom_id`
- تحديث `generic.service.ts` - `accounts_list` لإضافة `paramTransform` مع `xcom_id`
- تحديث `cost-center.service.ts` - `getAccounts()` لإضافة `xcom_id`
- التحقق من جميع الاستدعاءات الأخرى

### 2. شاشة إعدادات الضرائب
- إنشاء `services/api/tax.service.ts` - خدمة للضرائب من `getTaxPrcList`
- تحديث `types/models/tax.ts` - إضافة `Tax` interface
- إنشاء `app/(pages)/settings/taxes/page.tsx` - Server Component
- إنشاء `app/(pages)/settings/taxes/components/TaxesClient.tsx` - Client Component
- تحديث `app/(pages)/components/Sidebar/index.tsx` - إضافة رابط الضرائب
- التصميم يطابق الصورة: جدول مع أعمدة (رقم، الاسم، الرمز، النسبة، الحساب، الخيارات)

### 3. تقرير قائمة الدخل
- إنشاء `app/(pages)/reports/income-statement/page.tsx` - تقرير قائمة الدخل
- إنشاء خدمة API للتقارير إذا لزم الأمر
- إضافة رابط في Sidebar تحت "تقارير الحسابات"
- التصميم يطابق الصورة: قائمة الدخل مع الفلاتر والنتائج

