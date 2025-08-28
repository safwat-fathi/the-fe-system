# تصفية العملاء والموردين في الفواتير

## المشكلة
كانت جميع العملاء والموردين تظهر في قوائم الفواتير، بما في ذلك أولئك الذين لديهم `box_type = 2` والذين لا يجب أن يظهروا في الفواتير.

## الحل المطبق

### 1. **إضافة شرط التصفية**
تم إضافة شرط تصفية في دالة `fetchCustomers` في جميع صفحات الفواتير:
```typescript
// تصفية العملاء والموردين بحيث لا يكون box_type = 2
const filteredCustomers = response.filter((customer) => customer.box_type !== 2);
```

### 2. **الشرط المطبق**
```typescript
customer.box_type !== 2
```
هذا يعني:
- **يتم استبعاد**: العملاء والموردين الذين لديهم `box_type = 2`
- **يتم إدراج**: جميع العملاء والموردين الآخرين (box_type = 1, 3, 4, إلخ)

## الملفات المعدلة

### 1. `app/dashboard/forms/invoices/Gold_invoice1/page.tsx`
- تعديل دالة `fetchCustomers` لإضافة تصفية `box_type !== 2`

### 2. `app/dashboard/forms/invoices/Gold_invoice2/page.tsx`
- تعديل دالة `fetchCustomers` لإضافة تصفية `box_type !== 2`

### 3. `app/dashboard/forms/invoices/Gold_invoice3/page.tsx`
- تعديل دالة `fetchCustomers` لإضافة تصفية `box_type !== 2`

### 4. `app/dashboard/forms/invoices/Gold_invoice4/page.tsx`
- تعديل دالة `fetchCustomers` لإضافة تصفية `box_type !== 2`

## التغييرات المطبقة

### قبل التعديل:
```typescript
async function fetchCustomers() {
  const response = await fetchData<any[]>(`${API_BASE_URL}customers_list`);
  if (response) {
    setCustomers(response); // جميع العملاء والموردين
  }
}
```

### بعد التعديل:
```typescript
async function fetchCustomers() {
  const response = await fetchData<any[]>(`${API_BASE_URL}customers_list`);
  if (response) {
    // تصفية العملاء والموردين بحيث لا يكون box_type = 2
    const filteredCustomers = response.filter((customer) => customer.box_type !== 2);
    setCustomers(filteredCustomers); // العملاء والموردين المصفاة
  }
}
```

## أنواع الفواتير المتأثرة

### جميع أنواع الفواتير:
- **`Gold_invoice1`**: فاتورة شراء
- **`Gold_invoice2`**: فاتورة بيع
- **`Gold_invoice3`**: فاتورة مردود شراء
- **`Gold_invoice4`**: فاتورة مردود بيع

## الفوائد

### 1. **دقة البيانات**
- استبعاد العملاء والموردين غير المؤهلين للفواتير
- عرض فقط العملاء والموردين الصالحين

### 2. **تحسين الأداء**
- تقليل عدد العناصر في قوائم الاختيار
- تحسين سرعة البحث والاختيار

### 3. **منع الأخطاء**
- منع اختيار عملاء أو موردين غير مؤهلين
- تقليل احتمالية الأخطاء في البيانات

### 4. **وضوح الواجهة**
- قوائم اختيار أكثر تنظيماً
- تجربة مستخدم محسنة

## كيفية الاختبار

### 1. **فتح أي فاتورة**
- افتح أي نوع من الفواتير (شراء، بيع، مردود)
- انتقل إلى قائمة اختيار العميل/المورد

### 2. **التحقق من القائمة**
- تأكد من عدم وجود عملاء أو موردين لديهم `box_type = 2`
- تأكد من وجود العملاء والموردين الآخرين

### 3. **اختبار البحث**
- جرب البحث عن عملاء أو موردين
- تأكد من أن النتائج لا تحتوي على `box_type = 2`

### 4. **اختبار الاختيار**
- اختر عميل أو مورد من القائمة
- تأكد من أن البيانات تظهر بشكل صحيح

## ملاحظات مهمة

### 1. **التوافق مع النظام**
- التصفية تطبق على جميع أنواع الفواتير
- لا تؤثر على البيانات المخزنة، فقط على العرض

### 2. **الأداء**
- التصفية تتم على جانب العميل (Frontend)
- لا تؤثر على سرعة تحميل البيانات من الخادم

### 3. **المرونة**
- يمكن تعديل الشرط بسهولة إذا تغيرت المتطلبات
- يمكن إضافة شروط تصفية إضافية

### 4. **الأمان**
- التصفية لا تحل محل التحقق من الخادم
- يجب التأكد من تطبيق نفس الشروط في API

## أمثلة على box_type

### box_type = 1
- **الحالة**: نشط
- **النتيجة**: يظهر في قوائم الفواتير ✅

### box_type = 2
- **الحالة**: محظور/غير مؤهل
- **النتيجة**: لا يظهر في قوائم الفواتير ❌

### box_type = 3
- **الحالة**: مؤقت
- **النتيجة**: يظهر في قوائم الفواتير ✅

### box_type = 4
- **الحالة**: خاص
- **النتيجة**: يظهر في قوائم الفواتير ✅

## التطوير المستقبلي

### 1. **إضافة شروط تصفية إضافية**
```typescript
const filteredCustomers = response.filter((customer) => 
  customer.box_type !== 2 && 
  customer.status === 'active' &&
  customer.is_approved === true
);
```

### 2. **تصفية حسب نوع الفاتورة**
```typescript
// تصفية مختلفة حسب نوع الفاتورة
const filteredCustomers = response.filter((customer) => {
  if (invoiceType === "purchase") {
    return customer.box_type !== 2 && customer.is_supplier === true;
  } else {
    return customer.box_type !== 2 && customer.is_customer === true;
  }
});
```

### 3. **إضافة خيارات تصفية للمستخدم**
- إضافة خيارات لعرض/إخفاء أنواع معينة
- إضافة خيارات بحث متقدمة
