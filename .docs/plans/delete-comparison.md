# مقارنة عملية الحذف: مركز التكلفة vs الصنف

## 1. API Endpoints

### مركز التكلفة (Cost Center)
```
DELETE http://84.46.240.24:8000/api/api_delete_cost/{id}
```
- **Method**: DELETE
- **Parameters**: `id` فقط في URL
- **Query Parameters**: لا يوجد (undefined)
- **Headers**: يتم إضافة Authorization token تلقائياً من HttpService

### الصنف (Item)
```
DELETE http://84.46.240.24:8000/api/api_delete_item/{id}
```
- **Method**: DELETE
- **Parameters**: `id` فقط في URL
- **Query Parameters**: لا يوجد (undefined)
- **Headers**: يتم إضافة Authorization token تلقائياً من HttpService

**الخلاصة**: نفس الطريقة، لكن endpoints مختلفة فقط.

---

## 2. Service Methods

### مركز التكلفة (`cost-center.service.ts`)
```typescript
async deleteCostCenter(id: number): Promise<boolean> {
  try {
    const response = await this.delete(`api_delete_cost/${id}`, undefined, {
      cache: "no-store",
    });
    return response.success;
  } catch (error) {
    console.error("Error deleting cost center:", error);
    throw new Error("حدث خطأ أثناء حذف مركز التكلفة");
  }
}
```

**الخصائص**:
- بسيط جداً
- يعيد `response.success` مباشرة
- معالجة أخطاء بسيطة

### الصنف (`item.service.ts`)
```typescript
async deleteItem(id: number): Promise<boolean> {
  try {
    const response = await this.delete(`api_delete_item/${id}`, undefined, {
      cache: "no-store",
    });
    
    if (response.success) {
      return true;
    }
    
    const errorMessage = response.message || "حدث خطأ أثناء حذف الصنف";
    
    // معالجة خاصة لخطأ 500
    if (errorMessage.includes("500") || errorMessage.includes("Internal Server Error")) {
      throw new Error("لا يمكن حذف الصنف حالياً. قد يكون مرتبطاً ببيانات أخرى في النظام");
    }
    
    return false;
  } catch (error: any) {
    console.error("Error deleting item:", error);
    
    // معالجة خاصة لخطأ 500
    if (error?.status === 500 || error?.message?.includes("500") || error?.message?.includes("Internal Server Error")) {
      throw new Error("لا يمكن حذف الصنف حالياً. قد يكون مرتبطاً ببيانات أخرى في النظام");
    }
    
    throw new Error(error?.message || "حدث خطأ أثناء حذف الصنف");
  }
}
```

**الخصائص**:
- أكثر تعقيداً
- معالجة أخطاء مفصلة
- رسائل خطأ مخصصة لخطأ 500
- يتحقق من `response.message`

**الفرق**: الصنف لديه معالجة أخطاء أكثر تفصيلاً، خاصة لخطأ 500.

---

## 3. Client Components

### مركز التكلفة (`CostCentersClient.tsx`)
```typescript
const handleDelete = async (id: number) => {
  if (!confirm("هل تريد حذف مركز التكلفة هذا؟")) return;
  
  // Optimistic delete
  setCostCenters((prevCenters) => prevCenters.filter((cc) => cc.id !== id));
  
  try {
    const result = await costCenterService.deleteCostCenter(id);
    
    if (result) {
      toast.success("✅ تم حذف مركز التكلفة بنجاح");
      await revalidateTableData("cost_centers_list");
      loadCostCenters();
    } else {
      toast.error("❌ فشل في حذف مركز التكلفة");
      loadCostCenters();
    }
  } catch (error) {
    toast.error("❌ حدث خطأ أثناء الحذف");
    loadCostCenters();
  }
};
```

**الخصائص**:
- يستخدم `confirm()` القديم
- Optimistic delete (حذف فوري من القائمة)
- إعادة تحميل البيانات في حالة الخطأ
- استخدام `revalidateTableData` و `loadCostCenters`

### الصنف (`ItemsClient.tsx`)
```typescript
const handleDeleteClick = (item: ItemModel) => {
  if (!item.id) {
    toast.error("❌ لا يمكن حذف صنف بدون معرف");
    return;
  }
  setItemToDelete(item);
  setDeleteModalOpen(true);
};

const handleDeleteConfirm = async () => {
  if (!itemToDelete?.id) {
    setDeleteModalOpen(false);
    setItemToDelete(null);
    return;
  }
  
  try {
    const result = await itemService.deleteItem(itemToDelete.id);
    
    if (result) {
      toast.success("✅ تم حذف الصنف بنجاح");
      setItems((prevItems) => prevItems.filter((i) => i.id !== itemToDelete.id));
      setItemsCount((prevCount) => Math.max(0, prevCount - 1));
      router.refresh();
    } else {
      toast.error("❌ فشل في حذف الصنف");
    }
  } catch (error: any) {
    console.error("Error deleting item:", error);
    const errorMessage = error?.message || "❌ حدث خطأ أثناء حذف الصنف";
    toast.error(errorMessage);
  } finally {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  }
};
```

**الخصائص**:
- يستخدم `ConfirmationModal` الحديث
- فصل منطق فتح الـ Modal عن تنفيذ الحذف
- معالجة أخطاء مفصلة مع رسائل مخصصة
- استخدام `router.refresh()` بدلاً من إعادة تحميل البيانات يدوياً
- لا يوجد optimistic delete (ينتظر النتيجة من API)

**الفرق**: الصنف يستخدم Modal حديث ويحسن معالجة الأخطاء.

---

## 4. ملخص الاختلافات

| الميزة | مركز التكلفة | الصنف |
|--------|-------------|-------|
| **API Endpoint** | `api_delete_cost/{id}` | `api_delete_item/{id}` |
| **Query Params** | لا يوجد | لا يوجد |
| **معالجة الأخطاء** | بسيطة | مفصلة |
| **رسالة خطأ 500** | عامة | مخصصة |
| **UI للتأكيد** | `confirm()` | `ConfirmationModal` |
| **Optimistic Delete** | ✅ نعم | ❌ لا |
| **إعادة التحميل** | `loadCostCenters()` | `router.refresh()` |
| **State Management** | مباشر | مع Modal state |

---

## 5. التوصيات

1. **توحيد الطريقة**: يمكن توحيد طريقة الحذف بين الشاشات
2. **استخدام ConfirmationModal**: استبدال جميع `confirm()` بـ `ConfirmationModal`
3. **معالجة الأخطاء**: تطبيق معالجة الأخطاء المفصلة على جميع الشاشات
4. **Optimistic Delete**: يمكن إضافته للصنف أيضاً لتحسين UX

---

## 6. Request Details

### مركز التكلفة
```http
DELETE /api/api_delete_cost/123 HTTP/1.1
Host: 84.46.240.24:8000
Authorization: Bearer {token}
Cache-Control: no-store
```

### الصنف
```http
DELETE /api/api_delete_item/123 HTTP/1.1
Host: 84.46.240.24:8000
Authorization: Bearer {token}
Cache-Control: no-store
```

**الخلاصة**: نفس الطريقة تماماً، الفرق فقط في endpoint.

