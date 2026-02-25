import type { VoucherDetail } from "@/types/voucher";

import { useCallback, useRef } from "react";

import useEnterKeyNavigation from "../../invoices/hooks/useEnterKeyNavigation";

import useKeyAsTab from "@/hooks/useKeyAsTab";

interface UseBalanceKeyboardNavigationProps {
  isEditing: boolean;
  details: VoucherDetail[];
  addDetailRow: () => void;
}

export function useBalanceKeyboardNavigation({
  isEditing,
  details,
  addDetailRow,
}: UseBalanceKeyboardNavigationProps) {
  // Refs for keyboard navigation
  const selectorsRef = useRef<HTMLDivElement>(null);

  // Hook for Enter key navigation in top form fields
  const { handleKeyDown: handleKeyDownSelectors } = useKeyAsTab({
    keys: ["Enter"],
    containerRef: selectorsRef,
    disabled: !isEditing,
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

      // Ignore if React Select menu is open
      if (
        target.getAttribute("aria-expanded") === "true" ||
        target.closest('[aria-expanded="true"]')
      ) {
        return true;
      }

      return false;
    },
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
  });

  // Hook for Enter key navigation in table rows
  const { setInputRef, handleKeyDown: handleKeyDownTable } =
    useEnterKeyNavigation({
      rows: details,
      rowHasValue: (row) => {
        return !!(
          row?.acc_id ||
          (row?.debit && row.debit > 0) ||
          (row?.credit && row.credit > 0) ||
          (row?.g_debit && row.g_debit > 0) ||
          (row?.g_credit && row.g_credit > 0)
        );
      },
      onAddRow: addDetailRow,
    });

  // دالة مساعدة للانتقال للحقل التالي مباشرة
  const focusNextField = useCallback((rowIndex: number, colIndex: number) => {
    // البحث عن input التالي مباشرة
    const nextCol = colIndex + 1;
    const nextInput = document.querySelector(
      `input[data-row="${rowIndex}"][data-col="${nextCol}"]`,
    ) as HTMLInputElement;

    if (nextInput) {
      nextInput.focus();
      nextInput.select?.();

      return true;
    }

    return false;
  }, []);

  return {
    selectorsRef,
    handleKeyDownSelectors,
    setInputRef,
    handleKeyDownTable,
    focusNextField,
  };
}
