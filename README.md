# نظام إدارة المبيعات والمشتريات

## التكوين والإعداد

### متغيرات البيئة المطلوبة

قبل تشغيل النظام، يجب إنشاء ملف `.env.local` في المجلد الرئيسي للمشروع مع المتغيرات التالية:

```env
# API Configuration (مطلوب)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Gold Price API (اختياري)
NEXT_PUBLIC_API_GOLD_PRICE=
```

#### شرح المتغيرات:

1. **NEXT_PUBLIC_API_BASE_URL** (مطلوب):
   - عنوان URL الأساسي لـ API الخاص بالنظام
   - مثال: `http://localhost:8000/api` أو `https://api.yourserver.com`

2. **NEXT_PUBLIC_API_GOLD_PRICE** (اختياري):
   - رابط API للحصول على سعر الذهب الحالي
   - يمكن استخدام خدمات مثل:
     - goldapi.io
     - metalpriceapi.com
   - مثال: `https://api.metalpriceapi.com/v1/latest?api_key=YOUR_KEY&base=XAU&currencies=SAR`
   - إذا لم يتم تعيينه، سيعرض النظام "-" بدلاً من سعر الذهب

### خطوات التشغيل

1. انسخ ملف `.env.example` إلى `.env.local` (أو أنشئ ملف `.env.local` جديد)
2. قم بتعديل القيم حسب إعداداتك
3. شغّل الأمر `npm run dev` لتشغيل النظام في بيئة التطوير

## التحديثات الأخيرة

### آلية البحث في الحسابات - قيد التسوية

تم إضافة آلية البحث في الحسابات في شاشة قيد التسوية بنفس آلية البحث المستخدمة في الأصناف في فواتير البيع.

#### الميزات المضافة:

1. **البحث المباشر في الحسابات**: 
   - إمكانية البحث بالكود أو الاسم
   - نتائج فورية أثناء الكتابة
   - ترتيب النتائج حسب الأفضلية (الكود أولاً ثم الاسم)

2. **واجهة مستخدم محسنة**:
   - استخدام AsyncCreatableSelect بدلاً من select العادي
   - إمكانية إنشاء حساب جديد من الواجهة
   - عرض الكود والاسم معاً في النتائج

3. **تحسينات تقنية**:
   - إضافة API endpoint جديد للبحث في الحسابات: `SearchAccountsList`
   - دالة مساعدة `searchAccounts` في utilities/api.ts
   - تحديث VoucherDetail interface لإضافة acc_code و acc_name
   - إدارة الحسابات المحملة في الذاكرة

#### الملفات المحدثة:

- `utilities/api.ts`: إضافة API endpoint ودالة البحث
- `components/voucher/VoucherDetailsTable.tsx`: تحديث واجهة اختيار الحسابات
- `types/voucher.ts`: إضافة حقول acc_code و acc_name
- `app/dashboard/forms/voucher/page.tsx`: إضافة دالة تحديث الحسابات المحملة
- `components/voucher/VoucherContainer.tsx`: تمرير دالة تحديث الحسابات

#### كيفية الاستخدام:

1. افتح شاشة قيد التسوية
2. في عمود "الحساب" في جدول التفاصيل
3. ابدأ بكتابة كود الحساب أو اسمه
4. ستظهر النتائج المطابقة فوراً
5. اختر الحساب المطلوب من القائمة
6. يمكنك أيضاً إنشاء حساب جديد من الواجهة

#### ملاحظات تقنية:

- API endpoint: `GET /api/SearchAccountsList/?q={query}&page={page}`
- يدعم البحث في الكود والاسم معاً
- النتائج مرتبة حسب الأفضلية
- يدعم التحميل التدريجي (pagination)
