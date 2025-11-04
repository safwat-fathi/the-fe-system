# خطة تحديث التقارير المالية لاستخدام gl_transaction

## الهدف
تحديث التقارير الأربعة التالية لاستخدام `gl_transaction` كمصدر بيانات:
1. الميزانية العمومية (Balance Sheet)
2. ميزان المراجعة (Trial Balance)
3. دفتر القيود (Journal Ledger)
4. دفتر الأستاذ (General Ledger)

## التقارير الحالية
- **Account Statement** يستخدم بالفعل `glTransactionService.getAll()` ✅
- التقارير الأربعة الأخرى لديها `TODO` ولا تجلب بيانات حقيقية ❌

## التغييرات المطلوبة

### 1. الميزانية العمومية (Balance Sheet)
- **المصدر**: `gl_transaction` عبر `glTransactionService.getAll()`
- **البيانات المطلوبة**: 
  - تجميع حسب الحساب (`acc`)
  - حساب إجمالي المدين (`debit_base`) والدائن (`credit_base`)
  - التجميع حسب مستوى الحساب (`level`)
  - التاريخ: حتى تاريخ معين
- **الفلترة**: 
  - `xfrom_date`: بداية السنة أو تاريخ محدد
  - `xto_date`: تاريخ التقرير
  - `xacc_id`: حسب الحساب (اختياري)
  - `xcom_id`: 1

### 2. ميزان المراجعة (Trial Balance)
- **المصدر**: `gl_transaction` عبر `glTransactionService.getAll()`
- **البيانات المطلوبة**:
  - تجميع حسب الحساب (`acc`)
  - رصيد افتتاحي: من بداية السنة حتى `startDate`
  - حركات: من `startDate` حتى `endDate`
  - رصيد إغلاق: من بداية السنة حتى `endDate`
  - حساب إجمالي المدين والدائن
- **الفلترة**:
  - `xfrom_date`: `startDate`
  - `xto_date`: `endDate`
  - `xcom_id`: 1

### 3. دفتر القيود (Journal Ledger)
- **المصدر**: `gl_transaction` عبر `glTransactionService.getAll()`
- **البيانات المطلوبة**:
  - جميع الحركات من `startDate` حتى `endDate`
  - عرض كل حركة مع: التاريخ، نوع الحركة، الحساب، الوصف، المدين، الدائن
  - ترتيب حسب التاريخ و `seq`
- **الفلترة**:
  - `xfrom_date`: `startDate`
  - `xto_date`: `endDate`
  - `xtrans_type`: حسب نوع القيد (اختياري)
  - `xtrans_id`: رقم قيد محدد (اختياري)
  - `xcom_id`: 1

### 4. دفتر الأستاذ (General Ledger)
- **المصدر**: `gl_transaction` عبر `glTransactionService.getAll()`
- **البيانات المطلوبة**:
  - تجميع حسب الحساب (`acc`)
  - عرض تفاصيل الحركات لكل حساب
  - حساب إجمالي المدين والدائن لكل حساب
  - الرصيد النهائي (المدين - الدائن)
- **الفلترة**:
  - `xfrom_date`: `startDate`
  - `xto_date`: `endDate`
  - `xacc_id`: رقم حساب محدد (اختياري)
  - `xcom_id`: 1

## الخطوات التنفيذية

### المرحلة 1: إنشاء Utilities مشتركة
1. إنشاء `utilities/reports/gl-transaction-helpers.ts`:
   - `fetchGLTransactions(params)`: جلب البيانات من `gl_transaction`
   - `groupTransactionsByAccount(transactions)`: تجميع حسب الحساب
   - `calculateAccountBalance(transactions, accountId)`: حساب رصيد الحساب
   - `calculateOpeningBalance(transactions, startDate)`: حساب الرصيد الافتتاحي
   - `formatTransactionForReport(transaction)`: تحويل البيانات للعرض

### المرحلة 2: تحديث كل تقرير
1. **Balance Sheet**:
   - استيراد `glTransactionService` و `accountService`
   - جلب الحسابات وتجميعها حسب المستوى
   - جلب `gl_transaction` حسب التاريخ
   - تجميع الحركات حسب الحساب
   - حساب إجمالي المدين والدائن لكل حساب
   - عرض البيانات في الجدول

2. **Trial Balance**:
   - جلب `gl_transaction` للفترة المحددة
   - جلب `gl_transaction` للرصيد الافتتاحي (من بداية السنة حتى `startDate`)
   - تجميع حسب الحساب
   - حساب: رصيد افتتاحي، حركات، رصيد إغلاق
   - عرض البيانات في الجدول

3. **Journal Ledger**:
   - جلب `gl_transaction` للفترة المحددة
   - فلترة حسب نوع القيد (إن وجد)
   - ترتيب حسب التاريخ و `seq`
   - عرض كل حركة في الجدول

4. **General Ledger**:
   - جلب `gl_transaction` للفترة المحددة
   - فلترة حسب الحساب (إن وجد)
   - تجميع حسب الحساب
   - عرض تفاصيل الحركات لكل حساب
   - حساب إجمالي المدين والدائن والرصيد النهائي

### المرحلة 3: جلب معلومات الحسابات
- استخدام `accountService.getAllAccounts()` للحصول على أسماء الحسابات
- ربط `acc` في `gl_transaction` مع `acc_id` في `Account` لعرض اسم الحساب

## ملاحظات مهمة
1. **التواريخ**: يجب تحويل التواريخ من `YYYY-MM-DD` إلى الصيغة المطلوبة للـ API
2. **الأرقام**: استخدام `debit_base` و `credit_base` (وليس `debit` و `credit`) للمبالغ النقدية
3. **الذهب**: استخدام `g_debit_base` و `g_credit_base` للمبالغ الذهبية (إن لزم)
4. **الأداء**: استخدام `useMemo` و `useCallback` لتحسين الأداء
5. **التعامل مع الأخطاء**: استخدام `try-catch` وعرض رسائل خطأ واضحة
6. **Loading States**: عرض حالة التحميل أثناء جلب البيانات

## الملفات التي سيتم تعديلها
1. `app/(pages)/reports/balance-sheet/components/BalanceSheetClient.tsx`
2. `app/(pages)/reports/trial-balance/components/TrialBalanceClient.tsx`
3. `app/(pages)/reports/journal-ledger/components/JournalLedgerClient.tsx`
4. `app/(pages)/reports/general-ledger/components/GeneralLedgerClient.tsx`
5. `utilities/reports/gl-transaction-helpers.ts` (جديد)

## الملفات المرجعية
- `app/(pages)/reports/account-statement/components/AccountStatementClient.tsx` (مرجع)
- `services/api/gl-transaction.service.ts`
- `types/models/gl-transaction.ts`

