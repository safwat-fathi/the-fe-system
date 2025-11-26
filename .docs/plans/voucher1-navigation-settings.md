# تطبيق إعدادات التنقل على سند القبض (voucher1) وسند الصرف (voucher2)

## ملخص التغييرات المطبقة على voucher1

### 1. إضافة Refs للتنقل
- `selectorsRef`: للحقول العلوية (رقم المرجع، التاريخ، مركز التكلفة، الحالة)
- `notesInputRef`: لحقل البيان
- `firstCashTableInputRef`: لأول حقل في جدول النقدية

### 2. إعدادات useKeyAsTab للحقول العلوية
- `keys: ["Enter"]`
- `containerRef: selectorsRef`
- `onKeyDownCapture={handleKeyDownSelectors}` على container الحقول
- `onBoundaryFocus`: للانتقال من حقل الحالة إلى حقل البيان
- `shouldIgnoreEvent`: يستثني:
  - العناصر مع `data-skip-key-as-tab="true"`
  - textareas و buttons
  - القوائم المفتوحة (listbox)
  - Popovers و dialogs

### 3. إضافة useEnterKeyNavigation لجدول النقدية
```typescript
const {
  setInputRef: setCashInputRef,
  handleKeyDown: handleCashKeyDown,
  focusFirstInRow: focusFirstInCashRow,
} = useEnterKeyNavigation({
  rows: voucherBoxes,
  rowHasValue: (row) => {
    return !!(row?.amount && row.amount > 0);
  },
  onAddRow: addVoucherBoxRow,
});
```

### 4. إضافة useEnterKeyNavigation لجدول الحسابات
```typescript
const {
  setInputRef,
  handleKeyDown: handleKeyDownTable,
  focusFirstInRow,
} = useEnterKeyNavigation({
  rows: details,
  rowHasValue: (row) => {
    return !!(
      row?.acc_id ||
      (row?.debit && row.debit > 0) ||
      (row?.credit && row.credit > 0)
    );
  },
  onAddRow: addDetailRow,
});
```

### 5. إضافة data-skip-key-as-tab على الأزرار
- زر توسيع البيان: `data-skip-key-as-tab="true"`
- زر إضافة صف في جدول النقدية: `data-skip-key-as-tab="true"`
- زر إضافة صف في جدول الحسابات: `data-skip-key-as-tab="true"`

### 6. إضافة onKeyDown على حقل البيان
```typescript
onKeyDown={(e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    // Move to first field in cash table
    firstCashTableInputRef.current?.focus();
  }
}}
```

### 7. إضافة onKeyDown على حقل الحالة (select)
```typescript
onKeyDown={(e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    // Let onKeyDownCapture handle the navigation
  }
}}
```

### 8. إضافة refs و onKeyDown handlers في جدول النقدية
- حقل المبلغ: `ref={setCashInputRef(index, 0)}` و `onKeyDown={handleCashKeyDown}`
- حقل الصندوق (ReactSelect): `ref` على div wrapper و `onKeyDownCapture` للتعامل مع Enter و F4
- حقل البيان: `ref={setCashInputRef(index, 2)}` و `onKeyDown={handleCashKeyDown}`
- حقل مركز التكلفة (ReactSelect): `ref` على div wrapper و `onKeyDownCapture` للتعامل مع Enter و F4
- حقل رقم الفاتورة: `ref={setCashInputRef(index, 4)}` و `onKeyDown={handleCashKeyDown}`

### 9. إضافة refs و onKeyDown handlers في جدول الحسابات
- حقل الحساب (AsyncCreatableSelect): `ref` على div wrapper و `onKeyDownCapture` للتعامل مع Enter و F4
- حقل المبلغ: `ref={setInputRef(index, 1)}` و `onKeyDown={handleKeyDownTable}`
- حقل البيان: `ref={setInputRef(index, 2)}` و `onKeyDown={handleKeyDownTable}`
- حقل مركز التكلفة (ReactSelect): `ref` على div wrapper و `onKeyDownCapture` للتعامل مع Enter و F4

### 10. استخدام currentColIndex في map
- استخدام `let currentColIndex = -1;` داخل `map`
- استخدام `const thisCol = ++currentColIndex;` لكل عمود

## خطوات التطبيق على voucher2

1. فتح ملف `app/[locale]/(pages)/forms/voucher2/page.tsx` - يستخدم نفس `CashReceiptVoucherClientPage`
2. التأكد من أن جميع التغييرات المطبقة على `CashReceiptVoucherClientPage.tsx` موجودة
3. اختبار التنقل في جميع الحقول

## ملاحظات
- voucher2 يستخدم نفس المكون `CashReceiptVoucherClientPage` من voucher1
- جميع التغييرات المطبقة على voucher1 ستطبق تلقائياً على voucher2

