import type { GVoucherDetail } from "@/types/voucher";

import { useRef } from "react";

import useKeyAsTab from "@/hooks/useKeyAsTab";

interface UseDeliveryKeyNavigationParams {
  isEditing: boolean;
  goldDetails: GVoucherDetail[];
  addGoldDetailRow: () => void;
}

export function useDeliveryKeyNavigation({
  isEditing,
  goldDetails,
  addGoldDetailRow,
}: UseDeliveryKeyNavigationParams) {
  const selectorsRef = useRef<HTMLDivElement>(null);

  const { handleKeyDown: handleKeyDownSelectors, handleF4KeyForSelect } =
    useKeyAsTab({
      keys: ["Enter"],
      containerRef: selectorsRef,
      disabled: !isEditing,
      focusableSelector:
        'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), [role="combobox"]',
      filterElement: (element) => {
        // Exclude elements with tabIndex={-1}
        if (element.tabIndex === -1) {
          return false;
        }

        // Exclude buttons with data-skip-key-as-tab="true"
        if (element.tagName.toLowerCase() === "button") {
          if (
            element.hasAttribute("data-skip-key-as-tab") ||
            element.closest("[data-skip-key-as-tab='true']")
          ) {
            return false;
          }
        }

        return true;
      },
      shouldIgnoreEvent: (event) => {
        const target = event.target as HTMLElement | null;

        if (!target) return false;

        // Ignore elements with data-skip-key-as-tab="true"
        if (target.closest("[data-skip-key-as-tab='true']")) {
          return true;
        }

        // Ignore textareas and buttons
        const tagName = target.tagName.toLowerCase();

        if (tagName === "textarea" || tagName === "button") {
          return true;
        }

        // ✅ السماح بالتنقل من حقل "البيان" (input[type="text"]) إلى الحقول التالية
        // إذا كان الحقل هو input[type="text"] وليس داخل combobox، نسمح بالتنقل
        if (tagName === "input" && target.getAttribute("type") === "text") {
          const isInCombobox = target.closest('[role="combobox"]');

          if (!isInCombobox) {
            return false; // Allow navigation
          }
        }

        // Ignore if inside an open dropdown list
        const listboxElement = target.closest('[role="listbox"]');

        if (listboxElement) {
          return true;
        }

        // Ignore if inside an open popover or dropdown
        const popoverElement = target.closest(
          '[role="dialog"], [role="menu"], [data-headlessui-state]',
        );

        if (popoverElement) {
          return true;
        }

        // Allow navigation through ReactSelect when closed
        const selectButton = target.closest('[role="combobox"]');

        if (selectButton) {
          const isExpanded =
            selectButton.getAttribute("aria-expanded") === "true";

          // إذا كانت القائمة مفتوحة، نسمح بالتفاعل الطبيعي
          // إذا كانت القائمة مغلقة، نسمح بالتنقل
          return isExpanded;
        }

        return false;
      },
      onBoundaryFocus: (direction) => {
        // عندما نصل لنهاية الحقول العلوية (بعد مركز التكلفة)، ننتقل لجدول الذهب
        if (direction === 1) {
          const currentElement = document.activeElement as HTMLElement;
          const isInSelectors = selectorsRef.current?.contains(currentElement);

          if (isInSelectors) {
            // ✅ التحقق من أننا في حقل مركز التكلفة تحديداً
            const costCenterSelect = document.getElementById(
              "delivery-cost-center-select",
            );
            const isInCostCenter = costCenterSelect?.contains(currentElement);

            if (isInCostCenter) {
              // ✅ إضافة صف جديد إذا لم يكن موجوداً
              if (goldDetails.length === 0) {
                addGoldDetailRow();
              }

              // ✅ الانتقال إلى أول حقل في جدول الذهب (حقل رقم الصنف)
              // استخدام polling لضمان العثور على العنصر بعد الريندر
              const focusToItemField = (attempt = 1) => {
                // محاولة العثور على الwrapper
                const wrapper = document.getElementById(
                  "item-select-wrapper-0",
                );

                if (wrapper) {
                  const input = wrapper.querySelector("input");

                  if (input) {
                    input.focus();
                    // التأكد من أن التركيز نجح
                    if (document.activeElement === input) {
                      return true;
                    }
                  }
                  // محاولة العثور على combobox
                  const combobox = wrapper.querySelector(
                    '[role="combobox"]',
                  ) as HTMLElement;

                  if (combobox) {
                    combobox.focus();

                    return true;
                  }
                }

                // إذا لم نجد العنصر أو لم ينجح التركيز، نعيد المحاولة
                if (attempt < 20) {
                  // المحاولة لمدة 1 ثانية تقريباً (20 * 50ms)
                  setTimeout(() => focusToItemField(attempt + 1), 50);
                }

                return false;
              };

              focusToItemField();

              return true;
            }
          }
        }

        return false;
      },
    });

  return {
    selectorsRef,
    handleKeyDownSelectors,
    handleF4KeyForSelect,
  };
}
