# دليل الانتقال من النظام القديم إلى HttpService الجديد

## نظرة عامة

تم تحديث نظام جلب البيانات في المشروع للانتقال من `fetchData` القديم إلى `HttpService` الجديد.

---

## ⚙️ التغييرات في الإعدادات

### 1. تحديث API Base URL

**قبل:**
```typescript
// في utilities/api.ts
export const API_BASE_URL = "http://149.102.143.102:8000/api/";
```

**بعد:**
```typescript
// في .env.local
NEXT_PUBLIC_API_BASE_URL=http://84.46.240.24:8000/api
```

```typescript
// في utilities/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://84.46.240.24:8000/api";
```

---

## 🔄 الانتقال من fetchData إلى HttpService

### مثال 1: جلب قائمة بيانات

**قبل (النظام القديم):**
```typescript
import { fetchData, API_ENDPOINTS } from "@/utilities/api";

const customers = await fetchData<Customer[]>(API_ENDPOINTS.CUSTOMERS_LIST);
```

**بعد (النظام الجديد):**
```typescript
import customerService from "@/services/api/customer.service";

const customers = await customerService.getAllCustomers();
```

### مثال 2: جلب بيانات HOME_LIST و Fractions

**قبل (النظام القديم):**
```typescript
import { fetchFractions } from "@/utilities/api";

const { frac, frac2 } = await fetchFractions();
```

**بعد (النظام الجديد):**
```typescript
import homeService from "@/services/api/home.service";

// للحصول على fractions فقط
const { frac, frac2 } = await homeService.getFractions();

// أو للحصول على جميع إعدادات النظام
const homeSettings = await homeService.getHomeSettings();
if (homeSettings) {
  const frac = homeSettings.frac;
  const frac2 = homeSettings.frac2;
  const purity = homeSettings.purity;
  const vatPerc = homeSettings.Vat_perc;
}
```

### مثال 3: جلب بيانات HOME_LIST الكاملة

**قبل (النظام القديم):**
```typescript
const res = await fetchData<any[]>(API_ENDPOINTS.HOME_LIST);
if (Array.isArray(res) && res.length > 0) {
  const p = parseFloat(res[0]?.purity);
  const vatPerc = parseFloat(res[0]?.Vat_perc);
}
```

**بعد (النظام الجديد):**
```typescript
const homeSettings = await homeService.getHomeSettings();
if (homeSettings) {
  const p = homeSettings.purity || 0;
  const vatPerc = homeSettings.Vat_perc || 0;
}
```

---

## 🏗️ بناء Service جديد

إذا كنت تريد إنشاء service جديد، اتبع هذا النمط:

```typescript
// services/api/your-service.service.ts
import { HttpService } from "@/services/base";
import { YourModel } from "@/types/models/your-model";

class YourService extends HttpService<YourModel> {
  constructor() {
    super("", 10000); // 10 seconds timeout (optional)
  }

  async getAll(): Promise<YourModel[]> {
    try {
      const response = await this.get<YourModel[]>(
        "your_endpoint",
        undefined,
        {
          cache: "force-cache",
          next: { tags: ["your-tag"] },
        },
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Error fetching data:", error);
      throw new Error("حدث خطأ أثناء جلب البيانات");
    }
  }
}

export default new YourService();
```

---

## 🔑 المزايا الجديدة

### 1. معالجة أفضل للأخطاء
```typescript
const response = await homeService.getHomeListWithDebug();

if (!response.success) {
  console.error("Error:", response.message);
  // معالجة الخطأ
}
```

### 2. Type Safety
```typescript
// TypeScript يعرف نوع البيانات تلقائياً
const customers: Customer[] = await customerService.getAllCustomers();
```

### 3. Timeout قابل للتخصيص
```typescript
class MyService extends HttpService<MyModel> {
  constructor() {
    super("", 30000); // 30 seconds timeout
  }
}
```

### 4. Cache Control
```typescript
const response = await this.get<Data[]>("endpoint", undefined, {
  cache: "no-store", // no caching
  // أو
  cache: "force-cache", // cache forever
  next: { revalidate: 60 }, // revalidate every 60 seconds
});
```

---

## 📝 قائمة التحقق للهجرة

- [x] ✅ تحديث `.env.local` مع `NEXT_PUBLIC_API_BASE_URL`
- [x] ✅ تحديث `utilities/api.ts` لاستخدام `process.env.NEXT_PUBLIC_API_BASE_URL`
- [x] ✅ إنشاء `homeService` مع `getFractions()` و `getHomeSettings()`
- [ ] ⏳ استبدال `fetchFractions()` بـ `homeService.getFractions()` في جميع الملفات
- [ ] ⏳ استبدال `fetchData(API_ENDPOINTS.HOME_LIST)` بـ `homeService.getHomeSettings()`
- [ ] ⏳ إنشاء services جديدة لباقي الـ endpoints

---

## 🎯 الملفات التي تحتاج تحديث

### الأولوية العالية:
1. `utilities/useFractions.ts` - يستخدم `fetchFractions`
2. `app/(pages)/forms/invoices/sale/page.tsx` - يستخدم `HOME_LIST`
3. `app/(pages)/forms/invoices/sale-return/page.tsx` - يستخدم `HOME_LIST`
4. `app/(pages)/forms/invoices/purchase/page.tsx` - يستخدم `HOME_LIST`
5. `app/(pages)/forms/invoices/purchase-return/page.tsx` - يستخدم `HOME_LIST`
6. `app/(pages)/settings/page.tsx` - يستخدم `HOME_LIST`

---

## 🚀 خطوات إعادة التشغيل

بعد تحديث `.env.local`:

1. أوقف السيرفر (`Ctrl+C`)
2. احذف `.next` folder (اختياري)
3. شغل السيرفر من جديد: `npm run dev`

---

## 📞 الدعم

إذا واجهت أي مشكلة أثناء الهجرة، راجع:
- صفحة الاختبار: `/test-service`
- ملف المثال: `services/api/home.service.ts`
- ملف المثال: `services/api/customer.service.ts`

