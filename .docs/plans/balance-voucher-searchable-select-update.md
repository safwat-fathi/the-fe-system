# تحديث SearchableSelect في القيد الافتتاحي

## الهدف
تحديث مكون `SearchableSelect` لدعم البحث الديناميكي (async search) واستبدال `AsyncCreatableSelect` من `react-select` في حقل الحساب في القيد الافتتاحي.

## التغييرات المطلوبة

### 1. تحديث `SearchableSelect` لدعم البحث الديناميكي
- إضافة prop `onSearch?: (searchTerm: string) => Promise<SearchableSelectOption[]>` للبحث الديناميكي
- إضافة prop `defaultOptions?: SearchableSelectOption[]` للخيارات الافتراضية
- إضافة prop `isLoading?: boolean` لعرض حالة التحميل
- إضافة debounce للبحث لتقليل عدد الطلبات
- استخدام `useMemo` و `useState` لإدارة الخيارات المحملة

### 2. استبدال `AsyncCreatableSelect` في حقل الحساب
- استبدال `AsyncCreatableSelect` بـ `SearchableSelect` في `BalanceVoucherClientPage.tsx`
- استخدام `onSearch` مع `loadAccountOptions`
- استخدام `onCreateNew` لإضافة حساب جديد (إن أمكن)
- الحفاظ على التنقل بلوحة المفاتيح الموجود

### 3. التأكد من التوافق
- التأكد من أن التنقل بلوحة المفاتيح (Enter, F4, Arrow keys) يعمل بشكل صحيح
- التأكد من أن `setInputRef` يعمل مع المكون الجديد
- التأكد من أن `getAccountSelectValue` يعمل بشكل صحيح

## الملفات المتأثرة
- `components/SearchableSelect.tsx` - تحديث المكون
- `app/(pages)/forms/balance/BalanceVoucherClientPage.tsx` - استبدال `AsyncCreatableSelect`

## ملاحظات
- المكون الحالي يستخدم `clsx` وليس `cn` من `lib/utils`
- يجب الحفاظ على جميع الميزات الحالية (F4, Enter, Arrow keys, etc.)
- يجب إضافة debounce للبحث لتقليل عدد الطلبات للخادم

