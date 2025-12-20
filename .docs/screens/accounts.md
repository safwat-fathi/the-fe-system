# شاشة الحسابات (Accounts Screen)

## 📋 نظرة عامة

شاشة الحسابات هي الواجهة الرئيسية لإدارة دليل الحسابات في النظام. تتيح للمستخدمين إدارة الحسابات بشكل هرمي (شجرة) مع إمكانيات البحث والفلترة والتحرير الكاملة.

---

## 📁 البنية العامة

### 1. الصفحات (Pages)

#### أ. الصفحة الرئيسية
**المسار:** `app/[locale]/(pages)/basic/accounts/page.tsx`

- **الوظيفة:** الصفحة الرئيسية التي تعرض شاشة الحسابات
- **المهام:**
  - جلب شجرة الحسابات من السيرفر
  - جلب قائمة العملات
  - تمرير البيانات إلى المكون العميل (`AccountsClient`)
  - معالجة أخطاء المصادقة وإعادة التوجيه

**الكود الرئيسي:**
```typescript
export default async function AccountsPage() {
  const t = await getTranslations("basic.accounts");

  try {
    const rootRequestPayload = {
      id: 0,
      acc_id: "0",
      acc_code: "0",
      acc_name: "0",
      acc_name_e: null,
      parent: null,
      acc_level: 1,
    };

    const [accountsData, currenciesData] = await Promise.all([
      accountService.getAccountsTree(rootRequestPayload).catch(() => [] as Account[]),
      accountService.getCurrencies().catch(() => [] as Currency[]),
    ]);

    return (
      <div className="responsive-container font-cairo">
        <Breadcrumb />
        <h1 className="responsive-text-xl font-bold mb-6">{t("title")}</h1>
        <AccountsClient
          initialAccounts={accountsData}
          initialCurrencies={currenciesData}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      await redirectToLogin();
    }
    throw error;
  }
}
```

#### ب. صفحة إضافة حساب جديد
**المسار:** `app/[locale]/(pages)/basic/accounts/new/page.tsx`

- **الوظيفة:** صفحة إضافة حساب جديد
- **المهام:**
  - جلب شجرة الحسابات والعملات
  - تمرير `parentId` و `suggestedAccId` من query params
  - عرض نموذج الإضافة

**Query Parameters:**
- `parentId`: معرف الحساب الأب (اختياري)
- `suggestedAccId`: رقم حساب مقترح (اختياري)

#### ج. صفحة عرض/تعديل حساب
**المسار:** `app/[locale]/(pages)/basic/accounts/[id]/page.tsx`

- **الوظيفة:** عرض أو تعديل حساب موجود
- **المهام:**
  - جلب بيانات الحساب بالمعرف
  - تحديد الوضع (view/edit) من query param `mode`
  - عرض `notFound()` إذا لم يوجد الحساب

**Query Parameters:**
- `mode`: `"edit"` أو `"view"` (افتراضي: `"view"`)

---

### 2. المكونات (Components)

#### أ. AccountsClient
**المسار:** `app/[locale]/(pages)/basic/accounts/components/AccountsClient.tsx`

**الوظائف الرئيسية:**

1. **عرض شجرة الحسابات**
   - عرض هرمي للحسابات مع أيقونات (📁 للمجلدات، 📄 للحسابات)
   - إمكانية توسيع/طي العقد
   - تمييز الحساب المختار

2. **البحث والفلترة**
   - البحث بالاسم أو رقم الحساب
   - فلترة حسب نوع الحساب (رئيسي/فرعي)
   - فلترة حسب نوع التقرير (أرباح وخسائر/ميزانية)

3. **عرض التفاصيل**
   - عرض معلومات الحساب المختار
   - عرض الحسابات الفرعية المباشرة في جدول
   - عرض Breadcrumb للمسار في الشجرة

4. **إدارة الحسابات**
   - إضافة حساب جديد
   - تعديل حساب موجود
   - حذف حساب
   - عرض تفاصيل الحساب

**الحالات (States):**
- `accounts`: قائمة الحسابات الكاملة
- `displayAccounts`: الحسابات المعروضة بعد الفلترة
- `expandedNodes`: العقد المفتوحة في الشجرة
- `selectedAccount`: الحساب المختار حالياً
- `searchTerm`: نص البحث
- `filterType`: نوع الفلترة (all/main/sub)
- `filterReport`: نوع التقرير (all/pl/balance)

#### ب. AccountFormClient
**المسار:** `app/[locale]/(pages)/basic/accounts/components/AccountFormClient.tsx`

**الوظائف الرئيسية:**

1. **إضافة حساب جديد**
   - توليد رقم حساب تلقائياً
   - تحديد الحساب الأب
   - التحقق من القيود (المستوى، عدد الحسابات الفرعية)

2. **تعديل حساب موجود**
   - تحميل بيانات الحساب
   - منع اختيار الحساب كأب لنفسه أو لأحد أبنائه

3. **عرض تفاصيل الحساب**
   - وضع القراءة فقط
   - إمكانية التبديل إلى وضع التعديل

**الحقول (Fields):**
- `acc_id`: رقم الحساب (مطلوب)
- `acc_name`: اسم الحساب (مطلوب)
- `acc_name_e`: اسم الحساب بالإنجليزي
- `parent`: الحساب الأب
- `acc_type`: نوع الحساب (1: رئيسي، 2: فرعي)
- `acc_rep`: نوع التقرير (1: أرباح وخسائر، 2: ميزانية)
- `cur`: العملة
- `acc_digit`: عدد الخانات العشرية
- `acc_level`: مستوى الحساب (للقراءة فقط)
- `acc_notes`: الملاحظات

---

### 3. الخدمات (Services)

#### أ. Account Service
**المسار:** `services/api/account.service.ts`

**الطرق (Methods):**

1. **`getAllAccounts(xcom_id?)`**
   - جلب قائمة الحسابات الكاملة
   - Query Params: `xcom_id`
   - Cache: 5 دقائق، tags: `["accounts", "accounts_list"]`

2. **`getAccountsTree(payload, xcom_id?, forceRefresh?)`**
   - جلب شجرة الحسابات
   - Query Params:
     - `xcom_id`: معرف الشركة
     - `id`: معرف الحساب الجذر
     - `acc_id`: رقم الحساب
     - `acc_code`: كود الحساب
     - `acc_name`: اسم الحساب
     - `acc_level`: مستوى الحساب
     - `parent`: معرف الحساب الأب (اختياري)
   - Cache: 5 دقائق (أو `no-store` إذا `forceRefresh = true`)

3. **`createAccount(account)`**
   - إنشاء حساب جديد
   - Body: بيانات الحساب (بدون `id`)
   - Cache: `no-store`

4. **`updateAccount(id, account)`**
   - تحديث حساب موجود
   - Body: بيانات الحساب المحدثة
   - Cache: `no-store`

5. **`deleteAccount(id)`**
   - حذف حساب
   - Cache: `no-store`

6. **`getAccountById(id)`**
   - جلب حساب بالمعرف
   - يستخدم `getAllAccounts()` ثم يبحث في القائمة

7. **`getCurrencies()`**
   - جلب قائمة العملات
   - Cache: 10 دقائق، tags: `["currencies", "currencies_list"]`

#### ب. Category Account Service
**المسار:** `services/api/cat-account.service.ts`

**الطرق (Methods):**

1. **`getCategoryAccounts(companyId, categoryId?)`**
   - جلب حسابات الفئات
   - Query Params:
     - `xcom_id`: معرف الشركة
     - `xcat_id`: معرف الفئة (اختياري، افتراضي: "0")
   - Cache: force-cache مع tags

2. **`createCategoryAccount(payload)`**
   - إنشاء حساب فئة
   - Body: `UpsertCategoryAccountPayload`
   - Cache: `no-store`

3. **`updateCategoryAccount(id, payload)`**
   - تحديث حساب فئة
   - Body: `UpsertCategoryAccountPayload`
   - Cache: `no-store`

4. **`deleteCategoryAccount(id)`**
   - حذف حساب فئة
   - Cache: `no-store`

---

### 4. Server Actions

#### أ. Accounts Actions
**المسار:** `app/actions/accounts.action.ts`

**الوظائف:**

1. **`getAccountsAction()`**
   - Server Action لجلب الحسابات
   - يُستخدم من Client Components

2. **`searchAccountsAction(query)`**
   - Server Action للبحث في الحسابات
   - يُستخدم من Client Components

#### ب. Category Accounts Actions
**المسار:** `app/actions/category-accounts.action.ts`

**الوظائف:**

1. **`getCategoryAccountsAction({ companyId, categoryId })`**
   - جلب حسابات الفئات

2. **`ensureCategoryAccountAction({ companyId, categoryId })`**
   - التأكد من وجود حساب فئة، وإنشاءه إذا لم يكن موجوداً

3. **`saveCategoryAccountAction({ id, companyId, categoryId, payload })`**
   - حفظ حساب فئة (إنشاء أو تحديث)

4. **`deleteCategoryAccountAction(id, companyId, categoryId)`**
   - حذف حساب فئة

---

### 5. Utilities

#### account-tree.ts
**المسار:** `app/[locale]/(pages)/basic/accounts/utils/account-tree.ts`

**الدوال المساعدة:**

1. **`normalizeAccountsTree(tree)`**
   - تحويل البيانات القادمة من API إلى شجرة حسابات منظمة
   - معالجة البيانات المختلفة (children, childs, child, etc.)
   - إزالة الحسابات الوهمية (id = 0, acc_id = "0")

2. **`flattenAccountTree(tree)`**
   - تحويل الشجرة إلى قائمة مسطحة
   - يُستخدم للبحث والفلترة

3. **`removeAccountFromTree(tree, accountId)`**
   - حذف حساب من الشجرة
   - يُستخدم في Optimistic Updates

4. **`generateAccountId(accounts, parentId)`**
   - توليد رقم حساب تلقائياً
   - القواعد:
     - إذا كان المستوى < 4: إضافة رقم تسلسلي (1, 2, 3, ...)
     - إذا كان المستوى = 4: إضافة رقم مكون من 4 أرقام (0001, 0002, ...)
   - التحقق من القيود:
     - الحد الأقصى للمستوى: 5
     - الحد الأقصى للحسابات الفرعية: 9

5. **`findAccountById(accounts, accountId)`**
   - البحث عن حساب بالمعرف في الشجرة

6. **`getAccountPath(accounts, account)`**
   - الحصول على مسار الحساب من الجذر حتى الحساب المحدد
   - يُستخدم في Breadcrumb

---

### 6. Types

#### Account Type
**المسار:** `types/models/account.ts`

```typescript
export type Account = {
  id: number;
  acc_id: string;
  acc_name: string;
  acc_name_e?: string;
  acc_type: number;        // 1: رئيسي, 2: فرعي
  parent: number | null;
  acc_level: number;
  acc_kind: number;
  acc_rep: number;         // 1: أرباح وخسائر, 2: ميزانية
  acc_digit: number;
  acc_priv: number;
  acc_cat: number;
  acc_notes?: string;
  cur?: number | null;
  children?: Account[];
};
```

#### CategoryAccount Type
**المسار:** `types/models/category-account.ts`

```typescript
export type CategoryAccount = {
  id: number;
  cat_status: number | boolean | null;
  cr_date?: string | null;
  cr_user?: number | null;
  upd_date?: string | null;
  upd_user?: number | null;
  com: number | null;
  cat: number | null;
  buy_acc: number | string | null;
  sell_acc: number | string | null;
  back_buy: number | string | null;
  back_sell: number | string | null;
  buy_acc2: number | string | null;
  sell_acc2: number | string | null;
  back_buy2: number | string | null;
  back_sell2: number | string | null;
  dist_acc: number | string | null;
  dist_acc2: number | string | null;
  back_dist: number | string | null;
  back_dist2: number | string | null;
  inv_trans1: number | string | null;
  inv_trans2: number | string | null;
  inv_trans3: number | string | null;
  inv_trans4: number | string | null;
  inv_acc: number | string | null;
  inv_acc2: number | string | null;
  cost_acc: number | string | null;
  cost_acc2: number | string | null;
};
```

---

## 🔌 API Endpoints

### Account Endpoints

#### 1. `GET /accounts_list`
**الوصف:** جلب قائمة الحسابات الكاملة

**Query Parameters:**
- `xcom_id` (required): معرف الشركة/الفرع

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "acc_id": "1000",
      "acc_name": "الأصول",
      "acc_type": 1,
      "parent": null,
      "acc_level": 1,
      ...
    }
  ]
}
```

**Cache:** 5 دقائق، tags: `["accounts", "accounts_list"]`

---

#### 2. `GET /getAccountsTree`
**الوصف:** جلب شجرة الحسابات

**Query Parameters:**
- `xcom_id` (required): معرف الشركة/الفرع
- `id` (required): معرف الحساب الجذر (0 للحصول على كل الشجرة)
- `acc_id` (required): رقم الحساب الجذر
- `acc_code` (required): كود الحساب الجذر
- `acc_name` (required): اسم الحساب الجذر
- `acc_level` (required): مستوى الحساب الجذر
- `parent` (optional): معرف الحساب الأب

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "acc_id": "1000",
      "acc_name": "الأصول",
      "children": [
        {
          "id": 2,
          "acc_id": "1001",
          "acc_name": "الأصول المتداولة",
          "parent": 1,
          "children": []
        }
      ]
    }
  ]
}
```

**Cache:** 5 دقائق، tags: `["accounts", "accounts-tree", "accounts-tree-company-{id}"]`

---

#### 3. `POST /api_create_account`
**الوصف:** إنشاء حساب جديد

**Request Body:**
```json
{
  "acc_id": "1001",
  "acc_name": "الأصول المتداولة",
  "acc_name_e": "Current Assets",
  "acc_type": 2,
  "parent": 1,
  "acc_level": 2,
  "acc_kind": 1,
  "acc_rep": 2,
  "acc_digit": 4,
  "acc_priv": 1,
  "acc_cat": 1,
  "acc_notes": "",
  "cur": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "acc_id": "1001",
    "acc_name": "الأصول المتداولة",
    ...
  }
}
```

**Cache:** `no-store`

---

#### 4. `PUT /api_update_account/{id}`
**الوصف:** تحديث حساب موجود

**Request Body:**
```json
{
  "id": 2,
  "acc_id": "1001",
  "acc_name": "الأصول المتداولة (محدث)",
  ...
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "acc_id": "1001",
    "acc_name": "الأصول المتداولة (محدث)",
    ...
  }
}
```

**Cache:** `no-store`

---

#### 5. `DELETE /api_delete_account/{id}`
**الوصف:** حذف حساب

**Response:**
```json
{
  "success": true
}
```

**Cache:** `no-store`

---

#### 6. `GET /currencies_list`
**الوصف:** جلب قائمة العملات

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cur_name": "ريال سعودي",
      "cur_code": "SAR"
    }
  ]
}
```

**Cache:** 10 دقائق، tags: `["currencies", "currencies_list"]`

---

### Category Account Endpoints

#### 1. `GET /cat_acc_list`
**الوصف:** جلب حسابات الفئات

**Query Parameters:**
- `xcom_id` (required): معرف الشركة/الفرع
- `xcat_id` (optional): معرف الفئة (افتراضي: "0" لجميع الفئات)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "com": 1,
      "cat": 1,
      "buy_acc": "5001",
      "sell_acc": "5002",
      ...
    }
  ]
}
```

**Cache:** force-cache، tags: `["category-accounts", "category-accounts-com-{id}", ...]`

---

#### 2. `POST /api_create_cat_acc`
**الوصف:** إنشاء حساب فئة

**Request Body:**
```json
{
  "com": "1",
  "cat": "1",
  "buy_acc": "5001",
  "sell_acc": "5002",
  ...
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "com": 1,
    "cat": 1,
    ...
  }
}
```

**Cache:** `no-store`

---

#### 3. `PUT /api_update_cat_acc/{id}`
**الوصف:** تحديث حساب فئة

**Request Body:**
```json
{
  "com": "1",
  "cat": "1",
  "buy_acc": "5001",
  ...
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    ...
  }
}
```

**Cache:** `no-store`

---

#### 4. `DELETE /api_delete_cat_acc/{id}`
**الوصف:** حذف حساب فئة

**Response:**
```json
{
  "success": true
}
```

**Cache:** `no-store`

---

## 🎯 الميزات الرئيسية

### 1. شجرة الحسابات
- **العرض الهرمي:** عرض الحسابات بشكل شجرة مع أيقونات
- **التوسيع/الطي:** إمكانية فتح وإغلاق العقد
- **التمييز البصري:** تمييز الحساب المختار والنتائج المطابقة للبحث

### 2. البحث والفلترة
- **البحث:** البحث بالاسم أو رقم الحساب
- **فلترة حسب النوع:** رئيسي أو فرعي
- **فلترة حسب التقرير:** أرباح وخسائر أو ميزانية
- **عرض النتائج:** عرض عدد النتائج المطابقة

### 3. إدارة الحسابات
- **إضافة:** إضافة حساب جديد مع توليد رقم تلقائي
- **تعديل:** تعديل بيانات الحساب
- **حذف:** حذف حساب مع تأكيد
- **عرض:** عرض تفاصيل الحساب في وضع القراءة فقط

### 4. التحقق من القيود
- **الحد الأقصى للمستوى:** 5 مستويات
- **الحد الأقصى للحسابات الفرعية:** 9 حسابات لكل مستوى
- **منع الحلقات:** منع اختيار الحساب كأب لنفسه أو لأحد أبنائه

### 5. توليد رقم الحساب التلقائي
- **المستوى < 4:** إضافة رقم تسلسلي (1, 2, 3, ...)
- **المستوى = 4:** إضافة رقم مكون من 4 أرقام (0001, 0002, ...)
- **التحقق:** التحقق من القيود قبل التوليد

---

## 🔒 الأمان

### 1. المصادقة
- استخدام Cookies لتخزين التوكن (server-side only)
- معالجة أخطاء المصادقة (401) وإعادة التوجيه
- استخدام Server Actions للعمليات الحساسة

### 2. التحقق من الصحة
- التحقق من البيانات قبل الحفظ
- التحقق من القيود (المستوى، عدد الحسابات الفرعية)
- منع الحلقات في الشجرة

### 3. التخزين المؤقت
- Cache للقراءة فقط
- `no-store` لعمليات الكتابة
- Revalidation بعد التعديلات

---

## 📊 التخزين المؤقت (Caching)

### Cache Strategy

| Endpoint | Cache Duration | Tags |
|----------|---------------|------|
| `accounts_list` | 5 دقائق | `["accounts", "accounts_list"]` |
| `getAccountsTree` | 5 دقائق | `["accounts", "accounts-tree", "accounts-tree-company-{id}"]` |
| `currencies_list` | 10 دقائق | `["currencies", "currencies_list"]` |
| `cat_acc_list` | force-cache | `["category-accounts", "category-accounts-com-{id}", ...]` |
| Create/Update/Delete | `no-store` | - |

### Revalidation
- بعد إنشاء/تحديث/حذف حساب: `revalidateTableData("accounts_list")`
- بعد إنشاء/تحديث/حذف حساب فئة: `revalidateTag("category-accounts")`

---

## 🎨 واجهة المستخدم

### 1. التخطيط
- **شريط الأدوات:** أزرار الإضافة والفلترة والبحث
- **الشجرة:** عرض هرمي للحسابات في اللوحة اليسرى
- **التفاصيل:** عرض تفاصيل الحساب المختار في اللوحة اليمنى

### 2. الأيقونات
- 📁 للحسابات التي تحتوي على حسابات فرعية
- 📄 للحسابات النهائية (بدون أبناء)

### 3. الألوان
- تمييز الحساب المختار: `bg-blue-50 border border-blue-200`
- تمييز نتائج البحث: `bg-yellow-100 border border-yellow-300`
- Hover: `hover:bg-gray-50`

### 4. الاستجابة (Responsive)
- استخدام `responsive-container` و `responsive-grid`
- تكيف التخطيط مع حجم الشاشة

---

## 🔄 تدفق البيانات

### 1. تحميل الصفحة
```
Page Component (Server)
  ↓
  Fetch: getAccountsTree() + getCurrencies()
  ↓
  Pass to: AccountsClient (Client)
  ↓
  Normalize: normalizeAccountsTree()
  ↓
  Display: Tree + Details
```

### 2. إضافة حساب جديد
```
User clicks "Add Account"
  ↓
  Navigate to: /basic/accounts/new?parentId={id}&suggestedAccId={id}
  ↓
  Page Component fetches accounts + currencies
  ↓
  AccountFormClient renders form
  ↓
  User fills form + clicks "Save"
  ↓
  Validate form
  ↓
  accountService.createAccount()
  ↓
  Revalidate cache
  ↓
  Navigate back to /basic/accounts
```

### 3. تعديل حساب
```
User clicks "Edit"
  ↓
  Navigate to: /basic/accounts/{id}?mode=edit
  ↓
  Page Component fetches account + accounts + currencies
  ↓
  AccountFormClient renders form with data
  ↓
  User modifies + clicks "Update"
  ↓
  Validate form
  ↓
  accountService.updateAccount()
  ↓
  Revalidate cache
  ↓
  Navigate back to /basic/accounts
```

### 4. حذف حساب
```
User clicks "Delete"
  ↓
  Confirm dialog
  ↓
  Optimistic update: removeAccountFromTree()
  ↓
  accountService.deleteAccount()
  ↓
  If success: Revalidate + Fetch fresh data
  If error: Rollback optimistic update
```

---

## 🐛 معالجة الأخطاء

### 1. أخطاء المصادقة
- **401 Unauthorized:** إعادة التوجيه إلى صفحة تسجيل الدخول
- **AuthenticationError:** معالجة في Page Component

### 2. أخطاء الشبكة
- **Network Error:** عرض رسالة خطأ للمستخدم
- **Timeout:** استخدام AbortSignal مع timeout

### 3. أخطاء التحقق
- **Validation Error:** عرض رسالة خطأ تحت الحقل
- **Constraint Error:** عرض رسالة خطأ توضيحية

### 4. أخطاء الخادم
- **500 Error:** عرض رسالة خطأ عامة
- **404 Not Found:** عرض `notFound()` في Next.js

---

## 📝 ملاحظات مهمة

### 1. استخدام `xcom_id`
- يتم جلب `xcom_id` تلقائياً من `branch-params`
- القيمة الافتراضية: `"1"`

### 2. تطبيع البيانات
- استخدام `normalizeAccountsTree()` لمعالجة البيانات المختلفة من API
- دعم تنسيقات متعددة (children, childs, child, etc.)

### 3. توليد رقم الحساب
- يتم توليد رقم الحساب تلقائياً بناءً على:
  - الحساب الأب
  - المستوى
  - عدد الحسابات الفرعية

### 4. القيود
- **الحد الأقصى للمستوى:** 5
- **الحد الأقصى للحسابات الفرعية:** 9 لكل مستوى
- **منع الحلقات:** منع اختيار الحساب كأب لنفسه أو لأحد أبنائه

### 5. Optimistic Updates
- في عملية الحذف: حذف الحساب من الواجهة فوراً
- في حالة الخطأ: إعادة الحساب إلى الواجهة

---

## 🔗 روابط ذات صلة

- [AGENTS.md](../../AGENTS.md) - إرشادات التطوير
- [Account Service](../../services/api/account.service.ts) - خدمة API للحسابات
- [Category Account Service](../../services/api/cat-account.service.ts) - خدمة API لحسابات الفئات
- [Account Tree Utils](./accounts/utils/account-tree.ts) - دوال معالجة شجرة الحسابات

---

## 📅 آخر تحديث

تم إنشاء هذا الملف في: 2025-01-27

---

## 👤 المؤلف

تم إنشاء هذا التوثيق بواسطة AI Assistant بناءً على مراجعة الكود المصدري.

