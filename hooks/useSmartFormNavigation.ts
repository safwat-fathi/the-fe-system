import useKeyAsTab, { UseKeyAsTabOptions } from "@/hooks/useKeyAsTab";

interface UseSmartFormNavigationProps
  extends Omit<
    UseKeyAsTabOptions,
    "focusableSelector" | "shouldIgnoreEvent" | "filterElement"
  > {
  skipSelectors?: string[];
}

export function useSmartFormNavigation({
  keys = ["Enter"],
  ...options
}: UseSmartFormNavigationProps) {
  return useKeyAsTab({
    keys,
    ...options,
    focusableSelector: [
      "a[href]",
      "area[href]",
      'button:not([tabindex="-1"])',
      'input:not([type="hidden"]):not([tabindex="-1"])',
      "select", // ✅ السماح بالمعطل
      'textarea:not([tabindex="-1"])',
      'iframe:not([tabindex="-1"])',
      'summary:not([tabindex="-1"])',
      '[contenteditable]:not([contenteditable="false"])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="combobox"]', // ✅ إضافة combobox للقوائم المنسدلة
    ].join(","),
    shouldIgnoreEvent: (event) => {
      const target = event.target as HTMLElement | null;

      if (!target) return false;

      // تجاهل العناصر المساعدة فقط
      if (target.closest("[data-skip-key-as-tab='true']")) {
        return true;
      }

      const tagName = target.tagName.toLowerCase();

      // تجاهل textareas و buttons المساعدة فقط
      if (
        tagName === "textarea" ||
        (tagName === "button" && target.hasAttribute("data-skip-key-as-tab"))
      ) {
        return true;
      }

      // ✅ معالجة خاصة لـ select العادي
      if (tagName === "select") {
        // ✅ نمنع فتح القائمة ونسمح بالتنقل فقط
        return false; // نسمح بالتنقل دائماً
      }

      // ✅ معالجة خاصة لـ ReactSelect (combobox)
      const selectButton = target.closest('[role="combobox"]');

      if (selectButton) {
        const isExpanded =
          selectButton.getAttribute("aria-expanded") === "true";

        // إذا كانت القائمة مفتوحة، نتجاهل Enter للسماح بالتفاعل الطبيعي
        // ✅ إذا كانت القائمة مفتوحة، نسمح بالتفاعل الطبيعي (اختيار عنصر)
        // إذا كانت القائمة مغلقة، نسمح بالتنقل
        return isExpanded;
      }

      // ✅ تجاهل إذا كنا داخل قائمة منسدلة مفتوحة (listbox)
      const listboxElement = target.closest('[role="listbox"]');

      if (listboxElement) {
        return true; // نسمح بالتفاعل الطبيعي داخل القائمة
      }

      // ✅ تجاهل إذا كنا داخل popover أو dropdown
      const popoverElement = target.closest(
        '[role="dialog"], [role="menu"], [data-headlessui-state]',
      );

      if (popoverElement) {
        return true;
      }

      // ✅ في جميع الحالات الأخرى، نسمح بالتنقل
      return false;
    },
    filterElement: (element) => {
      // استبعاد العناصر المخفية فقط
      if (element.getAttribute("aria-hidden") === "true") {
        return false;
      }

      // استبعاد العناصر غير المرئية فقط
      const style = window.getComputedStyle(element);

      if (
        style.visibility === "hidden" ||
        style.display === "none" ||
        style.opacity === "0"
      ) {
        return false;
      }

      // استبعاد العناصر مع tabIndex={-1} فقط
      if (element.tabIndex === -1) {
        return false;
      }

      // ✅ معالجة خاصة لـ select العادي
      if (element.tagName.toLowerCase() === "select") {
        // ✅ نسمح بالتركيز على select حتى لو كان معطل
        return true;
      }

      // ✅ معالجة خاصة لـ ReactSelect (combobox)
      const combobox = element.closest(
        '[role="combobox"]',
      ) as HTMLElement | null;

      if (combobox) {
        // ✅ نسمح بالتركيز على combobox حتى لو كان معطل
        // التأكد من أن tabIndex مناسب
        if (combobox.tabIndex < 0 && combobox.tabIndex !== undefined) {
          // إذا كان tabIndex سالب، نجعله 0 للسماح بالتركيز
          combobox.tabIndex = 0;
        }

        return true;
      }

      // ✅ معالجة خاصة لـ ReactSelect container
      // البحث عن container الذي يحتوي على combobox
      const reactSelectContainer = element.closest(
        '.react-select__control, [class*="react-select"]',
      );

      if (reactSelectContainer) {
        const comboboxInContainer = reactSelectContainer.querySelector(
          '[role="combobox"]',
        ) as HTMLElement | null;

        if (comboboxInContainer) {
          // ✅ نسمح بالتركيز على container إذا كان يحتوي على combobox
          return true;
        }
      }

      // استبعاد الأزرار المساعدة فقط
      if (element.tagName.toLowerCase() === "button") {
        if (
          element.hasAttribute("data-skip-key-as-tab") ||
          element.closest("[data-skip-key-as-tab='true']")
        ) {
          return false;
        }
      }

      // ✅ السماح بجميع العناصر الأخرى (حتى لو كانت disabled)
      return true;
    },
  });
}
