# خطة إعادة تصميم نظام إدارة الصلاحيات الشامل

## نظرة عامة
إعادة تصميم شامل لنظام إدارة الصلاحيات مع بنية هرمية متقدمة: **مجموعات → مستخدمين → أنظمة → أقسام → شاشات → صلاحيات**.

## البنية الهرمية

```
Groups (مجموعات)
  └── Users (مستخدمين)
      └── Systems (أنظمة)
          └── Sections (أقسام)
              └── Screens (شاشات)
                  └── Permissions (صلاحيات)
```

## الأنظمة المقترحة

### 1. نظام الحسابات (Accounting System)
- **البيانات الأساسية:**
  - الحسابات (accounts)
  - مراكز التكلفة (cost-centers)
  - الصناديق (boxes)
  - العملات (currencies)
- **النماذج:**
  - قيد افتتاحي (balance)
  - سند قبض (voucher1)
  - سند صرف (voucher2)
  - سند قبض عميل (gvoucher4)
  - سند صرف عميل (gvoucher5)
  - قيد تسوية (voucher)
  - سند استلام (receipt)
  - سند تسليم (delivery)
- **التقارير:**
  - تقرير السندات (vouchers)
  - كشف حساب (account-statement)
  - قائمة الدخل (income-statement)
  - الميزانية العمومية (balance-sheet)
  - ميزان المراجعة (trial-balance)
  - دفتر القيود (journal-ledger)
  - دفتر الأستاذ (general-ledger)

### 2. نظام الذهب (Gold System)
- **البيانات الأساسية:**
  - العملاء (customers)
  - أنواع العملاء (cust_type)
  - الأصناف (items)
  - الفئات (categories)
  - الوحدات (units)
- **النماذج:**
  - فواتير الشراء (invoices?type=purchase)
  - فواتير مردود الشراء (invoices?type=purchase-return)
  - فواتير البيع (invoices?type=sale)
  - فواتير مردود البيع (invoices?type=sale-return)
- **التقارير:**
  - قائمة الفواتير (invoices)
  - تقرير الضريبة (vat)
  - التقارير الضريبية (tax)

### 3. الإعدادات (Settings)
- إعدادات النظام (settings)
- الصلاحيات (permissions)
- الضرائب (taxes)
- خدمات الربط (integrations)

## الصلاحيات المقترحة لكل شاشة

- `view` - عرض/معاينة
- `add` - إضافة
- `edit` - تعديل
- `delete` - حذف
- `print` - طباعة
- `export` - تصدير
- `approve` - اعتماد (إذا لزم الأمر)

## هيكل الملفات المقترح (كل شيء في مجلد واحد)

```
app/(pages)/settings/permissions/
├── page.tsx                              # Server Component - الصفحة الرئيسية
├── components/
│   ├── PermissionsLayout.tsx             # Layout رئيسي مع Tabs
│   ├── GroupsManager/
│   │   ├── GroupsList.tsx               # قائمة المجموعات
│   │   ├── GroupForm.tsx                 # نموذج إضافة/تعديل مجموعة
│   │   ├── GroupPermissions.tsx          # إدارة صلاحيات المجموعة
│   │   ├── GroupUsers.tsx                # مستخدمين المجموعة
│   │   └── GroupCard.tsx                 # Card لعرض المجموعة
│   ├── UsersManager/
│   │   ├── UsersList.tsx                 # قائمة المستخدمين
│   │   ├── UserForm.tsx                  # نموذج إضافة/تعديل مستخدم
│   │   ├── UserGroups.tsx                # مجموعات المستخدم
│   │   ├── UserPermissions.tsx           # صلاحيات المستخدم (تخطي صلاحيات المجموعة)
│   │   └── UserCard.tsx                  # Card لعرض المستخدم
│   ├── PermissionsMatrix/
│   │   ├── SystemsTree.tsx               # شجرة الأنظمة والأقسام والشاشات
│   │   ├── PermissionToggle.tsx          # مفتاح تفعيل/إلغاء صلاحية
│   │   ├── BulkPermissions.tsx           # صلاحيات مجمعة
│   │   ├── PermissionBadge.tsx           # شارة عرض الصلاحية
│   │   └── SystemSection.tsx             # مكون قسم من النظام
│   └── Shared/
│       ├── SearchFilter.tsx              # بحث وتصفية
│       ├── LoadingState.tsx              # حالة التحميل
│       └── EmptyState.tsx                # حالة فارغة
├── hooks/
│   ├── usePermissions.ts                 # Hook لإدارة الصلاحيات
│   ├── useGroups.ts                      # Hook لإدارة المجموعات
│   ├── useUsers.ts                       # Hook لإدارة المستخدمين
│   ├── usePermissionMatrix.ts            # Hook لشجرة الصلاحيات
│   └── usePermissionCalculator.ts        # Hook لحساب الصلاحيات المدمجة
├── types/
│   ├── permissions.ts                    # أنواع الصلاحيات
│   ├── groups.ts                         # أنواع المجموعات
│   ├── users.ts                          # أنواع المستخدمين
│   └── systems.ts                        # أنواع الأنظمة والأقسام والشاشات
├── utils/
│   ├── permission-helpers.ts             # دوال مساعدة للصلاحيات
│   ├── system-map.ts                      # خريطة الأنظمة والأقسام والشاشات
│   ├── permission-calculator.ts          # حساب الصلاحيات المدمجة
│   └── permission-formatters.ts          # تنسيق وعرض الصلاحيات
└── actions/
    ├── group.action.ts                   # Server Actions للمجموعات
    ├── user.action.ts                    # Server Actions للمستخدمين
    └── permission.action.ts               # Server Actions للصلاحيات
```

## التصميم المقترح

### 1. واجهة Tabs الرئيسية
- **Tab 1: المجموعات** - إدارة المجموعات وصلاحياتها
- **Tab 2: المستخدمين** - إدارة المستخدمين وصلاحياتهم
- **Tab 3: مصفوفة الصلاحيات** - عرض شامل للصلاحيات

### 2. شجرة الصلاحيات
- Tree view تفاعلي مع expand/collapse
- Accordion للأنظمة والأقسام
- Checkboxes لكل صلاحية
- Bulk select للأنظمة/الأقسام
- Visual indicators للصلاحيات الموروثة من المجموعات

### 3. تجربة المستخدم
- Drag & Drop لإضافة مستخدمين للمجموعات
- Search & Filter في جميع القوائم
- Copy permissions من مجموعة/مستخدم لآخر
- Preview للصلاحيات قبل الحفظ
- Visual feedback للصلاحيات الموروثة vs المخصصة
- Smooth animations
- Loading states
- Error handling

## API Endpoints المقترحة

```
# المجموعات
GET    /api/groups                    # قائمة المجموعات
POST   /api/groups                    # إنشاء مجموعة
PUT    /api/groups/:id                # تحديث مجموعة
DELETE /api/groups/:id                # حذف مجموعة
GET    /api/groups/:id/permissions    # صلاحيات المجموعة
PUT    /api/groups/:id/permissions    # تحديث صلاحيات المجموعة
GET    /api/groups/:id/users          # مستخدمين المجموعة
POST   /api/groups/:id/users          # إضافة مستخدم للمجموعة
DELETE /api/groups/:id/users/:userId  # إزالة مستخدم من المجموعة

# المستخدمين
GET    /api/users                     # قائمة المستخدمين
POST   /api/users                     # إنشاء مستخدم
PUT    /api/users/:id                 # تحديث مستخدم
DELETE /api/users/:id                 # حذف مستخدم
GET    /api/users/:id/permissions     # صلاحيات المستخدم (مدمجة)
PUT    /api/users/:id/permissions     # تحديث صلاحيات المستخدم
GET    /api/users/:id/groups          # مجموعات المستخدم
POST   /api/users/:id/groups          # إضافة مستخدم لمجموعة
DELETE /api/users/:id/groups/:groupId # إزالة مستخدم من مجموعة

# الأنظمة والشاشات
GET    /api/systems                   # قائمة الأنظمة والأقسام والشاشات
GET    /api/permissions/calculate     # حساب الصلاحيات المدمجة لمستخدم
```

## خطة التنفيذ

### المرحلة 1: البنية الأساسية والأنواع
1. إنشاء أنواع البيانات (Types)
2. إنشاء خريطة الأنظمة والأقسام والشاشات
3. إنشاء Server Actions
4. إنشاء API Services

### المرحلة 2: واجهة المجموعات
1. GroupsList component
2. GroupForm component
3. GroupPermissions component
4. GroupUsers component

### المرحلة 3: واجهة المستخدمين
1. UsersList component
2. UserForm component
3. UserGroups component
4. UserPermissions component

### المرحلة 4: مصفوفة الصلاحيات
1. SystemsTree component
2. PermissionToggle component
3. BulkPermissions component
4. Permission preview

### المرحلة 5: التكامل والتحسينات
1. Integration مع الـ middleware
2. Integration مع الـ sidebar
3. Performance optimization
4. Testing

## ملاحظات التصميم

- استخدام Accordion للأنظمة والأقسام
- استخدام Checkbox groups للصلاحيات
- Visual indicators للصلاحيات:
  - ✅ أخضر: مسموح (من المجموعة أو مخصص)
  - ❌ أحمر: ممنوع
  - ⚠️ أصفر: موروث من مجموعة
  - 🔒 رمادي: بدون صلاحية
- Color coding للأنظمة المختلفة
- Smooth animations للانتقالات
- Responsive design للشاشات المختلفة
- استخدام Cairo font
- Modern UI with TailwindCSS
نع
