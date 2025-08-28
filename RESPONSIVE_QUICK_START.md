# دليل الاستخدام السريع للنظام المتجاوب

## 🚀 البدء السريع

### 1. استيراد المكونات
```tsx
import { 
  ResponsiveLayout, 
  ResponsiveGrid, 
  ResponsiveTable, 
  ResponsiveForm, 
  ResponsiveModal 
} from '@/components';
```

### 2. استخدام CSS Classes
```tsx
// تخطيط متجاوب
<div className="responsive-container">
  <h1 className="responsive-text-xl">العنوان</h1>
  <div className="responsive-filters">
    <Button className="responsive-btn">زر</Button>
    <Input className="responsive-search" />
  </div>
</div>
```

### 3. استخدام Utilities
```tsx
import { ResponsiveHelpers } from '@/utilities';

// استخدام مباشر
<div className={ResponsiveHelpers.container}>
  <h1 className={ResponsiveHelpers.textXl}>العنوان</h1>
</div>
```

## 📱 Breakpoints المدعومة

| Breakpoint | العرض | الاستخدام |
|------------|-------|-----------|
| `xs` | 475px | الهواتف الصغيرة |
| `sm` | 640px | الهواتف |
| `md` | 768px | التابلت الصغير |
| `lg` | 1024px | التابلت |
| `xl` | 1280px | الكمبيوتر الصغير |
| `2xl` | 1536px | الكمبيوتر |
| `3xl` | 1920px | الكمبيوتر الكبير |

## 🎯 أمثلة سريعة

### صفحة بسيطة متجاوبة
```tsx
import { ResponsiveLayout } from '@/components';

export default function MyPage() {
  return (
    <ResponsiveLayout>
      <h1 className="responsive-text-xl font-bold mb-4">عنوان الصفحة</h1>
      <div className="responsive-filters">
        <Button className="responsive-btn">إضافة جديد</Button>
        <Input className="responsive-search" placeholder="بحث..." />
      </div>
      {/* محتوى الصفحة */}
    </ResponsiveLayout>
  );
}
```

### جدول متجاوب
```tsx
import { ResponsiveTable } from '@/components';

<ResponsiveTable ariaLabel="جدول البيانات">
  <TableHeader>
    <TableColumn>الاسم</TableColumn>
    <TableColumn>البريد الإلكتروني</TableColumn>
  </TableHeader>
  <TableBody>
    {/* بيانات الجدول */}
  </TableBody>
</ResponsiveTable>
```

### نموذج متجاوب
```tsx
import { ResponsiveForm, FormFieldHalf, FormFieldFull } from '@/components';

<ResponsiveForm cols={3}>
  <FormFieldHalf>
    <Input label="الاسم الأول" />
  </FormFieldHalf>
  <FormFieldHalf>
    <Input label="الاسم الأخير" />
  </FormFieldHalf>
  <FormFieldFull>
    <Input label="البريد الإلكتروني" />
  </FormFieldFull>
</ResponsiveForm>
```

## 🎨 CSS Classes الأكثر استخداماً

### التخطيط
- `responsive-container` - حاوية متجاوبة
- `responsive-filters` - مرشحات متجاوبة
- `responsive-pagination` - ترقيم متجاوب

### النصوص
- `responsive-text-xs` - نص صغير
- `responsive-text-sm` - نص صغير
- `responsive-text-base` - نص أساسي
- `responsive-text-lg` - نص كبير
- `responsive-text-xl` - نص كبير جداً
- `responsive-text-2xl` - نص ضخم

### الأزرار والمدخلات
- `responsive-btn` - زر متجاوب
- `responsive-search` - بحث متجاوب
- `responsive-search-group` - مجموعة بحث

### الجداول
- `responsive-table` - جدول متجاوب

## 🔧 Utilities المتاحة

```tsx
import { ResponsiveHelpers } from '@/utilities';

// استخدام مباشر
ResponsiveHelpers.container    // responsive-container
ResponsiveHelpers.textXl       // responsive-text-xl
ResponsiveHelpers.filters      // responsive-filters
ResponsiveHelpers.btn          // responsive-btn
ResponsiveHelpers.search       // responsive-search
```

## 📋 قائمة التحقق

- [ ] استيراد المكونات المطلوبة
- [ ] استخدام `ResponsiveLayout` للتخطيط العام
- [ ] تطبيق CSS classes المناسبة
- [ ] اختبار على أحجام شاشات مختلفة
- [ ] التأكد من الأداء والسرعة

## 🎯 نصائح سريعة

1. **ابدأ بـ ResponsiveLayout** لكل صفحة
2. **استخدم responsive-text-*** للنصوص
3. **طبق responsive-filters** للمرشحات
4. **استخدم ResponsiveTable** للجداول
5. **اختبر على الهاتف أولاً**

## 📞 الدعم

للحصول على دعم إضافي أو أسئلة، راجع الملف الكامل:
`RESPONSIVE_DESIGN_SYSTEM_README.md`

---

**تم إنشاء هذا النظام ليكون سهل الاستخدام وفعال! 🚀**
