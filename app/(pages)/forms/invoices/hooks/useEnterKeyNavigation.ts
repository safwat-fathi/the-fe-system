import { useRef, useCallback, type KeyboardEvent } from "react";

type NullableInput = HTMLInputElement | null;

interface UseEnterKeyNavigationOptions<Row> {
  rows: Row[];
  rowHasValue: (row: Row | undefined) => boolean;
  onAddRow: () => void;
}

interface HandleKeyDownOptions {
  isLastCol?: boolean;
  allowEnterDefaultWhenRowMissing?: boolean;
}

interface UseEnterKeyNavigationResult {
  setInputRef: (rowIndex: number, colIndex: number) => (node: NullableInput) => void;
  handleKeyDown: (
    event: KeyboardEvent,
    rowIndex: number,
    colIndex: number,
    options?: HandleKeyDownOptions,
  ) => void;
  focusFirstInRow: (rowIndex: number) => boolean;
  focusNode: (node: NullableInput) => void;
}

export default function useEnterKeyNavigation<Row>(
  options: UseEnterKeyNavigationOptions<Row>,
): UseEnterKeyNavigationResult {
  const { rows, rowHasValue, onAddRow } = options;
  const inputRefs = useRef<NullableInput[][]>([]);

  const focusNode = (node: NullableInput) => {
    try {
      if (!node) return;
      
      // إذا كان HTMLInputElement أو HTMLSelectElement مباشر
      if ((node as any) instanceof HTMLInputElement || (node as any) instanceof HTMLSelectElement) {
        (node as HTMLInputElement | HTMLSelectElement).focus();
        return;
      }
      
      // محاولة التركيز مباشرة
      if (typeof (node as any).focus === 'function') {
        (node as any).focus();
        return;
      }
      
      // البحث عن input داخل العنصر
      const nodeElement = node as HTMLElement;
      if (nodeElement) {
        // البحث عن input باستخدام inputId
        const inputId = nodeElement.id || nodeElement.getAttribute?.('id');
        if (inputId) {
          const foundInput = document.getElementById(inputId) as HTMLInputElement;
          if (foundInput) {
            foundInput.focus();
            return;
          }
        }
        
        // البحث عن input داخل العنصر
        const inputInside = nodeElement.querySelector?.('input') as HTMLInputElement;
        if (inputInside) {
          inputInside.focus();
          return;
        }
        
        // البحث عن combobox button
        const combobox = nodeElement.closest?.('[role="combobox"]') as HTMLElement;
        if (combobox) {
          combobox.focus();
          return;
        }
        
        // محاولة أخيرة: البحث عن أي input قابل للتركيز
        const anyInput = nodeElement.querySelector?.('input, select, [tabindex]:not([tabindex="-1"])') as HTMLElement;
        if (anyInput && typeof anyInput.focus === 'function') {
          anyInput.focus();
          return;
        }
      }
    } catch {
      // ignore focus failures
    }
  };

  const focusFirstInRow = useCallback((rowIndex: number) => {
    const rowRefs = inputRefs.current[rowIndex] || [];

    for (let i = 0; i < rowRefs.length; i += 1) {
      const el = rowRefs[i];
      if (el) {
        focusNode(el);
        return true;
      }
    }

    return false;
  }, []);

  const focusFirstInRowAsync = useCallback((rowIndex: number, tries = 6) => {
    const tick = (remaining: number) => {
      if (focusFirstInRow(rowIndex)) return;
      if (remaining <= 0) return;

      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(() => tick(remaining - 1));
      } else {
        setTimeout(() => tick(remaining - 1), 16);
      }
    };

    tick(tries);
  }, [focusFirstInRow]);

  const focusNextRowFirstCell = useCallback((rowIndex: number) => {
    focusFirstInRow(rowIndex);
    focusFirstInRowAsync(rowIndex, 8);
    setTimeout(() => focusFirstInRow(rowIndex), 0);
    setTimeout(() => focusFirstInRow(rowIndex), 40);
    setTimeout(() => focusFirstInRow(rowIndex), 100);
  }, [focusFirstInRow, focusFirstInRowAsync]);

  const handleKeyDown = useCallback(
    (
      event: KeyboardEvent,
      rowIndex: number,
      colIndex: number,
      { isLastCol, allowEnterDefaultWhenRowMissing }: HandleKeyDownOptions = {},
    ) => {
      const key = event.key;
      const target = event.target as HTMLElement | null;
      
      // التحقق من أننا لسنا داخل SearchableSelect listbox
      const isInListbox = target?.closest('[role="listbox"]');
      if (isInListbox) {
        return; // نترك الأسهم تعمل داخل القائمة
      }

      // التحقق من أننا لسنا في combobox مفتوح
      const selectButton = target?.closest('[role="combobox"]');
      const isExpanded = selectButton?.getAttribute("aria-expanded") === "true";
      if (isExpanded && (key === "ArrowDown" || key === "ArrowUp")) {
        return; // نترك الأسهم تعمل داخل القائمة المفتوحة
      }

      const rowRefs = inputRefs.current[rowIndex] || [];
      const lastColIndex = rowRefs.length - 1;
      const atLastCol =
        typeof isLastCol === "boolean" ? isLastCol : colIndex >= lastColIndex;
      const isLastRow = rowIndex === rows.length - 1;
      const hasValue = rowHasValue(rows[rowIndex]);

      // معالجة Arrow Keys للتنقل (RTL: اليمين = السابق، اليسار = التالي)
      if (key === "ArrowRight") {
        event.preventDefault();
        
        if (colIndex > 0) {
          // الانتقال للحقل السابق في نفس الصف (في RTL، السهم الأيمن = السابق)
          const prevInRow = rowRefs[colIndex - 1];
          if (prevInRow) {
            focusNode(prevInRow);
            // تحديد النص إذا كان input
            setTimeout(() => {
              const input = prevInRow as HTMLInputElement;
              if (input && input.select && typeof input.select === 'function') {
                input.select();
              }
            }, 0);
          }
        }
        return;
      }

      if (key === "ArrowLeft") {
        event.preventDefault();
        
        if (!atLastCol) {
          // الانتقال للحقل التالي في نفس الصف (في RTL، السهم الأيسر = التالي)
          const nextInRow = rowRefs[colIndex + 1];
          if (nextInRow) {
            focusNode(nextInRow);
            // تحديد النص إذا كان input
            setTimeout(() => {
              const input = nextInRow as HTMLInputElement;
              if (input && input.select && typeof input.select === 'function') {
                input.select();
              }
            }, 0);
          }
        }
        return;
      }

      if (key === "ArrowDown") {
        event.preventDefault(); // منع زيادة القيمة في input number
        
        if (!isLastRow) {
          // الانتقال للحقل في نفس العمود في الصف التالي
          const nextRowRefs = inputRefs.current[rowIndex + 1] || [];
          const sameColInNextRow = nextRowRefs[colIndex];
          if (sameColInNextRow) {
            focusNode(sameColInNextRow);
            // تحديد النص إذا كان input
            setTimeout(() => {
              const input = sameColInNextRow as HTMLInputElement;
              if (input && input.select && typeof input.select === 'function') {
                input.select();
              }
            }, 0);
          } else {
            // إذا لم يوجد، ننتقل لأول حقل في الصف التالي
            focusFirstInRow(rowIndex + 1);
          }
        } else {
          // إذا كان آخر صف، نضيف صف جديد
          onAddRow();
          focusNextRowFirstCell(rowIndex + 1);
        }
        return;
      }

      if (key === "ArrowUp") {
        event.preventDefault(); // منع تقليل القيمة في input number
        
        if (rowIndex > 0) {
          // الانتقال للحقل في نفس العمود في الصف السابق
          const prevRowRefs = inputRefs.current[rowIndex - 1] || [];
          const sameColInPrevRow = prevRowRefs[colIndex];
          if (sameColInPrevRow) {
            focusNode(sameColInPrevRow);
            // تحديد النص إذا كان input
            setTimeout(() => {
              const input = sameColInPrevRow as HTMLInputElement;
              if (input && input.select && typeof input.select === 'function') {
                input.select();
              }
            }, 0);
          } else {
            // إذا لم يوجد، ننتقل لأول حقل في الصف السابق
            focusFirstInRow(rowIndex - 1);
          }
        }
        return;
      }

      // معالجة Tab و Enter (الكود الأصلي)
      if (key !== "Tab" && key !== "Enter") return;
      if (key === "Tab" && (event as any).shiftKey) return;

      if (!hasValue) {
        if (key === "Tab") {
          event.preventDefault();
          return;
        } else if (key === "Enter" && !allowEnterDefaultWhenRowMissing) {
          event.preventDefault();
          return;
        }
        // إذا كان Enter و allowEnterDefaultWhenRowMissing = true، نستمر في التنقل
      }

      if (key === "Enter") {
        event.preventDefault();

        if (!atLastCol) {
          const nextInRow = rowRefs[colIndex + 1];
          if (nextInRow) focusNode(nextInRow);
          return;
        }

        if (!hasValue) {
          return;
        }

        if (!isLastRow) {
          focusFirstInRow(rowIndex + 1);
          return;
        }

        onAddRow();
        focusNextRowFirstCell(rowIndex + 1);
        return;
      }

      // Tab key
      if (!atLastCol) {
        return;
      }

      if (!hasValue) {
        return;
      }

      event.preventDefault();
      if (!isLastRow) {
        focusFirstInRow(rowIndex + 1);
        return;
      }

      onAddRow();
      focusNextRowFirstCell(rowIndex + 1);
    },
    [focusFirstInRow, focusNextRowFirstCell, onAddRow, rowHasValue, rows],
  );

  const setInputRef = useCallback(
    (rowIndex: number, colIndex: number) => (node: NullableInput) => {
      if (!inputRefs.current[rowIndex]) inputRefs.current[rowIndex] = [];
      inputRefs.current[rowIndex][colIndex] = node;
    },
    [],
  );

  return {
    setInputRef,
    handleKeyDown,
    focusFirstInRow,
    focusNode,
  };
}
