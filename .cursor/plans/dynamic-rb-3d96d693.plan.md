<!-- 3d96d693-a587-4ad1-a93c-b31c2da831db 9d941535-2867-4b31-b4c1-9b85c5eb6389 -->
# خطة تطوير نظام Sidebar ديناميكي مع RBAC متقدم

## نظرة عامة

تحويل السايدبار الثابت الحالي إلى نظام ديناميكي يعتمد على:

- جدول `objects` (هيكل شجري للأنظمة والأقسام والشاشات)
- صلاحيات على مستوى المجموعات (user_groups)
- صلاحيات شخصية للمستخدمين (user_permissions)
- صلاحيات تفصيلية لكل شاشة (view, create, edit, delete, print, export)

## الهيكل المعماري

### 1. البنية الخلفية (Backend Structure)

**جدول objects (موجود مسبقاً)**:

```
objects
├── id, name, name_en, parent_id, icon, path, order, type, is_active
└── type: 'module' | 'section' | 'screen'
```

**جداول الصلاحيات المتوقعة**:

- `user_groups`: المجموعات
- `user_group_members`: أعضاء المجموعات
- `group_permissions`: صلاحيات المجموعة على objects
- `user_permissions`: صلاحيات المستخدم المباشرة (تتجاوز المجموعة)

### 2. الملفات الجديدة

**Services Layer**:

- `services/api/menu.service.ts`: جلب قائمة objects مع الصلاحيات
- `services/api/permission.service.ts`: جلب وإدارة الصلاحيات
- `services/bff/sidebar-data.service.ts`: تجميع بيانات السايدبار (BFF pattern)

**Types**:

- `types/models/menu.ts`: نماذج الـ objects والصلاحيات
- `types/models/permission.ts`: نماذج الصلاحيات

**Components**:

- `app/(pages)/components/Sidebar/DynamicSidebar.tsx`: السايدبار الديناميكي الجديد
- `app/(pages)/components/Sidebar/MenuItem.tsx`: عنصر القائمة القابل لإعادة الاستخدام
- `components/PermissionGate.tsx`: component للتحكم في عرض الأزرار حسب الصلاحيات

**Utilities**:

- `utilities/permissions.ts`: دوال مساعدة للتحقق من الصلاحيات
- `utilities/menu.ts`: دوال بناء القائمة الشجرية

**Context/Store**:

- `stores/permissionStore.ts`: Zustand store لإدارة الصلاحيات

### 3. التعديلات على الملفات الموجودة

**Middleware**:

- `middlewares/rbac.middleware.ts`: تحديث للعمل مع النظام الديناميكي
- جلب صلاحيات المستخدم من API بدلاً من الـ hardcoded
- التحقق من الصلاحيات ديناميكياً حسب المسار

**User Model**:

- `types/models/user.ts`: إضافة حقول الصلاحيات والمجموعات
- إضافة `groups`, `permissions`, `merged_permissions`

**Layout**:

- `app/(pages)/layout.tsx`: استخدام DynamicSidebar بدلاً من الـ Sidebar الحالي

## التدفق المقترح

### 1. تسجيل الدخول

```
User Login → API returns user with groups → Store in cookie
→ Fetch merged permissions (groups + user specific)
→ Store in Zustand + Session
```

### 2. بناء السايدبار

```
Server Component → Fetch menu tree from API
→ Filter by user permissions (view only)
→ Pass to Client Component
→ Render dynamic collapsible tree
```

### 3. حماية المسارات

```
User navigates → Middleware checks path
→ Fetch required permissions for path
→ Check user's merged permissions
→ Allow/Deny access
```

### 4. التحكم في الأزرار

```
Page renders → PermissionGate checks user permissions
→ Show/Hide buttons (create, edit, delete, print, export)
→ Disable buttons if no permission
```

## نموذج البيانات

### API Response: Menu Tree

```typescript
{
  id: 1,
  name: "نظام الحسابات",
  icon: "BanknotesIcon",
  type: "module",
  children: [
    {
      id: 2,
      name: "البيانات الأساسية",
      type: "section",
      children: [
        {
          id: 3,
          name: "الحسابات",
          path: "/basic/accounts",
          type: "screen",
          permissions: ["view", "create", "edit", "delete"]
        }
      ]
    }
  ]
}
```

### API Response: User Permissions

```typescript
{
  user_id: 1,
  groups: [
    { id: 1, name: "المحاسبون" }
  ],
  permissions: [
    {
      object_id: 3, // screen id
      permissions: ["view", "create", "edit"],
      source: "group" // or "user"
    }
  ],
  merged_permissions: {
    "3": ["view", "create", "edit"],
    "4": ["view"]
  }
}
```

## مراحل التنفيذ

### المرحلة 1: البنية الأساسية

1. إنشاء Types للـ menu وPermissions
2. إنشاء MenuService للتواصل مع API
3. إنشاء PermissionService للتواصل مع API
4. إنشاء Zustand store للصلاحيات

### المرحلة 2: السايدبار الديناميكي

1. إنشاء DynamicSidebar component
2. إنشاء MenuItem component (recursive للشجرة)
3. جلب البيانات من API وبناء الشجرة
4. تطبيق الـ filtering حسب الصلاحيات

### المرحلة 3: RBAC Middleware

1. تحديث getUserPermissions للجلب من API
2. تحديث route matching ليكون ديناميكياً
3. إضافة caching للصلاحيات

### المرحلة 4: PermissionGate Component

1. إنشاء PermissionGate للتحكم في الأزرار
2. تطبيق على صفحات موجودة كمثال
3. إنشاء hooks مساعدة (usePermission)

### المرحلة 5: الاختبار والتوثيق

1. اختبار السايدبار مع سيناريوهات مختلفة
2. اختبار الـ middleware
3. كتابة أمثلة الاستخدام

## ملاحظات مهمة

1. **Caching**: استخدام Next.js cache للصلاحيات (revalidate: 300)
2. **Security**: التحقق من الصلاحيات على Server-Side دائماً
3. **UX**: عرض رسالة واضحة عند عدم وجود صلاحيات
4. **Performance**: Lazy loading للأيقونات الديناميكية
5. **Backward Compatibility**: الإبقاء على الـ Sidebar القديم مؤقتاً للمقارنة

## نقاط القرار

- استخدام نفس نمط الـ API الموجود (com, year parameters)
- دمج صلاحيات المجموعة + المستخدم (union)
- صلاحيات المستخدم المباشرة تُضاف فقط (لا تُلغي المجموعة)
- الـ icons تُخزن كـ string وتُحول إلى components

### To-dos

- [ ] إنشاء Types وModels للـ menu objects والـ permissions
- [ ] إنشاء MenuService وPermissionService للتواصل مع الـ API
- [ ] إنشاء Zustand store لإدارة الصلاحيات
- [ ] إنشاء دوال مساعدة للصلاحيات وبناء القائمة الشجرية
- [ ] إنشاء SidebarDataService (BFF) لتجميع بيانات السايدبار
- [ ] إنشاء DynamicSidebar وMenuItem components
- [ ] تحديث RBAC middleware للعمل مع النظام الديناميكي
- [ ] إنشاء PermissionGate component وhooks مساعدة
- [ ] دمج DynamicSidebar في الـ layout الرئيسي
- [ ] تطبيق PermissionGate على صفحة موجودة كمثال