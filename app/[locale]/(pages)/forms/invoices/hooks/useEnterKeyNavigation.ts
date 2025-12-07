import { useRef, useCallback, type KeyboardEvent } from "react";

type NullableInput = HTMLInputElement | null;

interface UseEnterKeyNavigationOptions<Row> {
  rows: Row[];
  rowHasValue: (row: Row | undefined) => boolean;
  onAddRow: () => void;
  onLastCell?: () => void;
}

interface HandleKeyDownOptions {
  isLastCol?: boolean;
  allowEnterDefaultWhenRowMissing?: boolean;
}

interface UseEnterKeyNavigationResult {
  setInputRef: (
    rowIndex: number,
    colIndex: number,
  ) => (node: NullableInput) => void;
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
  const { rows, rowHasValue, onAddRow, onLastCell } = options;
  const inputRefs = useRef<NullableInput[][]>([]);

  // ✅ دالة مساعدة للبحث المباشر عن combobox في حقل معين
  const findComboboxByCol = (
    rowIndex: number,
    colIndex: number,
  ): HTMLElement | null => {
    // حقل الحساب (col 0)
    if (colIndex === 0) {
      // محاولة 1: البحث المباشر
      const accountSelect = document.querySelector(
        `#account-select-${rowIndex}`,
      );

      if (accountSelect) {
        const combobox = accountSelect.querySelector(
          '[role="combobox"]',
        ) as HTMLElement;

        if (combobox) return combobox;
      }

      // محاولة 2: البحث في جميع comboboxes
      const allComboboxes = document.querySelectorAll('[role="combobox"]');

      for (let i = 0; i < allComboboxes.length; i += 1) {
        const cb = allComboboxes[i] as HTMLElement;
        const parent = cb.closest('[id^="account-select-"]');

        if (parent && parent.id === `account-select-${rowIndex}`) {
          return cb;
        }
      }
    }

    // مركز التكلفة (col 8)
    if (colIndex === 8) {
      // محاولة 1: البحث المباشر
      const costCenterSelect = document.querySelector(
        `#cost-center-detail-select-${rowIndex}`,
      );

      if (costCenterSelect) {
        const combobox = costCenterSelect.querySelector(
          '[role="combobox"]',
        ) as HTMLElement;

        if (combobox) return combobox;
      }

      // محاولة 2: البحث في جميع comboboxes
      const allComboboxes = document.querySelectorAll('[role="combobox"]');

      for (let i = 0; i < allComboboxes.length; i += 1) {
        const cb = allComboboxes[i] as HTMLElement;
        const parent = cb.closest('[id^="cost-center-detail-select-"]');

        if (parent && parent.id === `cost-center-detail-select-${rowIndex}`) {
          return cb;
        }
      }
    }

    return null;
  };

  const focusNode = (node: NullableInput) => {
    try {
      if (!node) return;

      const nodeElement = node as HTMLElement;

      // ✅ التحقق من node نفسه أولاً - إذا كان combobox
      if (nodeElement.getAttribute?.("role") === "combobox") {
        // ✅ إضافة tabIndex إذا لم يكن موجوداً أو كان -1
        if (
          !nodeElement.hasAttribute("tabindex") ||
          nodeElement.getAttribute("tabindex") === "-1"
        ) {
          nodeElement.setAttribute("tabindex", "0");
        }
        nodeElement.focus();

        return;
      }

      // إذا كان HTMLInputElement أو HTMLSelectElement مباشر
      if (
        (node as any) instanceof HTMLInputElement ||
        (node as any) instanceof HTMLSelectElement
      ) {
        (node as HTMLInputElement | HTMLSelectElement).focus();

        return;
      }

      // محاولة التركيز مباشرة
      if (typeof (node as any).focus === "function") {
        (node as any).focus();

        return;
      }

      if (nodeElement) {
        // البحث عن input باستخدام inputId
        const inputId = nodeElement.id || nodeElement.getAttribute?.("id");

        if (inputId) {
          const foundInput = document.getElementById(
            inputId,
          ) as HTMLInputElement;

          if (foundInput) {
            foundInput.focus();

            return;
          }
        }

        // ✅ البحث عن combobox داخل العنصر أولاً
        const comboboxInside = nodeElement.querySelector?.(
          '[role="combobox"]',
        ) as HTMLElement;

        if (comboboxInside) {
          // ✅ إضافة tabIndex
          if (
            !comboboxInside.hasAttribute("tabindex") ||
            comboboxInside.getAttribute("tabindex") === "-1"
          ) {
            comboboxInside.setAttribute("tabindex", "0");
          }
          comboboxInside.focus();

          return;
        }

        // البحث عن input داخل العنصر
        const inputInside = nodeElement.querySelector?.(
          "input",
        ) as HTMLInputElement;

        if (inputInside) {
          inputInside.focus();

          return;
        }

        // البحث عن combobox button باستخدام closest
        const combobox = nodeElement.closest?.(
          '[role="combobox"]',
        ) as HTMLElement;

        if (combobox) {
          // ✅ إضافة tabIndex
          if (
            !combobox.hasAttribute("tabindex") ||
            combobox.getAttribute("tabindex") === "-1"
          ) {
            combobox.setAttribute("tabindex", "0");
          }
          combobox.focus();

          return;
        }

        // محاولة أخيرة: البحث عن أي input قابل للتركيز
        const anyInput = nodeElement.querySelector?.(
          'input, select, [tabindex]:not([tabindex="-1"])',
        ) as HTMLElement;

        if (anyInput && typeof anyInput.focus === "function") {
          anyInput.focus();

          return;
        }
      }
    } catch {
      // ignore focus failures
    }
  };

  const focusFirstInRow = useCallback((rowIndex: number) => {
    // ✅ محاولة 1: البحث عن combobox في حقل الحساب أولاً
    const accountCombobox = findComboboxByCol(rowIndex, 0);

    if (accountCombobox) {
      // ✅ إضافة tabIndex
      if (
        !accountCombobox.hasAttribute("tabindex") ||
        accountCombobox.getAttribute("tabindex") === "-1"
      ) {
        accountCombobox.setAttribute("tabindex", "0");
      }
      accountCombobox.focus();

      return true;
    }

    const rowRefs = inputRefs.current[rowIndex] || [];

    // ✅ محاولة 2: استخدام refs
    for (let i = 0; i < rowRefs.length; i += 1) {
      const el = rowRefs[i];

      if (el) {
        focusNode(el);

        return true;
      }
    }

    // ✅ محاولة 3: البحث باستخدام data-col
    const firstInput = document.querySelector(
      `input[data-row="${rowIndex}"][data-col="0"]`,
    ) as HTMLInputElement;

    if (firstInput) {
      firstInput.focus();

      return true;
    }

    return false;
  }, []);

  const focusFirstInRowAsync = useCallback(
    (rowIndex: number, tries = 6) => {
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
    },
    [focusFirstInRow],
  );

  const focusNextRowFirstCell = useCallback(
    (rowIndex: number) => {
      focusFirstInRow(rowIndex);
      focusFirstInRowAsync(rowIndex, 8);
      setTimeout(() => focusFirstInRow(rowIndex), 0);
      setTimeout(() => focusFirstInRow(rowIndex), 40);
      setTimeout(() => focusFirstInRow(rowIndex), 100);
    },
    [focusFirstInRow, focusFirstInRowAsync],
  );

  const handleKeyDown = useCallback(
    (
      event: KeyboardEvent,
      rowIndex: number,
      colIndex: number,
      { isLastCol, allowEnterDefaultWhenRowMissing: _allowEnterDefaultWhenRowMissing }: HandleKeyDownOptions = {},
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
      const lastColIndex = rowRefs.length > 0 ? rowRefs.length - 1 : -1;
      const atLastCol =
        typeof isLastCol === "boolean"
          ? isLastCol
          : lastColIndex >= 0 && colIndex >= lastColIndex;
      const isLastRow = rowIndex === rows.length - 1;
      const hasValue = rowHasValue(rows[rowIndex]);

      // معالجة Arrow Keys للتنقل (RTL: اليمين = السابق، اليسار = التالي)
      if (key === "ArrowRight") {
        event.preventDefault();

        if (colIndex > 0) {
          // الانتقال للحقل السابق في نفس الصف (في RTL، السهم الأيمن = السابق)
          const prevInRow = rowRefs[colIndex - 1];
          const prevCol = colIndex - 1;

          if (prevInRow) {
            focusNode(prevInRow);
            // تحديد النص إذا كان input
            setTimeout(() => {
              const input = prevInRow as HTMLInputElement;

              if (input && input.select && typeof input.select === "function") {
                input.select();
              }
            }, 0);
          } else {
            // ✅ إذا لم يكن هناك ref، نبحث مباشرة عن combobox أولاً
            const combobox = findComboboxByCol(rowIndex, prevCol);

            if (combobox) {
              // ✅ إضافة tabIndex
              if (
                !combobox.hasAttribute("tabindex") ||
                combobox.getAttribute("tabindex") === "-1"
              ) {
                combobox.setAttribute("tabindex", "0");
              }
              combobox.focus();

              return;
            }

            // ✅ البحث باستخدام data-col
            const prevInput = document.querySelector(
              `input[data-row="${rowIndex}"][data-col="${prevCol}"]`,
            ) as HTMLInputElement;

            if (prevInput) {
              prevInput.focus();
              setTimeout(() => {
                if (
                  prevInput.select &&
                  typeof prevInput.select === "function"
                ) {
                  prevInput.select();
                }
              }, 0);
            }
          }
        }

        return;
      }

      if (key === "ArrowLeft") {
        event.preventDefault();

        if (!atLastCol) {
          // الانتقال للحقل التالي في نفس الصف (في RTL، السهم الأيسر = التالي)
          const nextInRow = rowRefs[colIndex + 1];
          const nextCol = colIndex + 1;

          if (nextInRow) {
            focusNode(nextInRow);
            // تحديد النص إذا كان input
            setTimeout(() => {
              const input = nextInRow as HTMLInputElement;

              if (input && input.select && typeof input.select === "function") {
                input.select();
              }
            }, 0);
          } else {
            // ✅ إذا لم يكن هناك ref، نبحث مباشرة عن combobox أولاً
            const combobox = findComboboxByCol(rowIndex, nextCol);

            if (combobox) {
              // ✅ إضافة tabIndex
              if (
                !combobox.hasAttribute("tabindex") ||
                combobox.getAttribute("tabindex") === "-1"
              ) {
                combobox.setAttribute("tabindex", "0");
              }
              combobox.focus();

              return;
            }

            // ✅ البحث باستخدام data-col
            const nextInput = document.querySelector(
              `input[data-row="${rowIndex}"][data-col="${nextCol}"]`,
            ) as HTMLInputElement;

            if (nextInput) {
              nextInput.focus();
              setTimeout(() => {
                if (
                  nextInput.select &&
                  typeof nextInput.select === "function"
                ) {
                  nextInput.select();
                }
              }, 0);
            }
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

              if (input && input.select && typeof input.select === "function") {
                input.select();
              }
            }, 0);
          } else {
            // ✅ إذا لم يوجد ref، نبحث مباشرة عن combobox أولاً
            const combobox = findComboboxByCol(rowIndex + 1, colIndex);

            if (combobox) {
              // ✅ إضافة tabIndex
              if (
                !combobox.hasAttribute("tabindex") ||
                combobox.getAttribute("tabindex") === "-1"
              ) {
                combobox.setAttribute("tabindex", "0");
              }
              combobox.focus();

              return;
            }

            // ✅ البحث باستخدام data-col
            const sameColInput = document.querySelector(
              `input[data-row="${rowIndex + 1}"][data-col="${colIndex}"]`,
            ) as HTMLInputElement;

            if (sameColInput) {
              sameColInput.focus();
              setTimeout(() => {
                if (
                  sameColInput.select &&
                  typeof sameColInput.select === "function"
                ) {
                  sameColInput.select();
                }
              }, 0);
            } else {
              // إذا لم يوجد، ننتقل لأول حقل في الصف التالي
              focusFirstInRow(rowIndex + 1);
            }
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

              if (input && input.select && typeof input.select === "function") {
                input.select();
              }
            }, 0);
          } else {
            // ✅ إذا لم يوجد ref، نبحث مباشرة عن combobox أولاً
            const combobox = findComboboxByCol(rowIndex - 1, colIndex);

            if (combobox) {
              // ✅ إضافة tabIndex
              if (
                !combobox.hasAttribute("tabindex") ||
                combobox.getAttribute("tabindex") === "-1"
              ) {
                combobox.setAttribute("tabindex", "0");
              }
              combobox.focus();

              return;
            }

            // ✅ البحث باستخدام data-col
            const sameColInput = document.querySelector(
              `input[data-row="${rowIndex - 1}"][data-col="${colIndex}"]`,
            ) as HTMLInputElement;

            if (sameColInput) {
              sameColInput.focus();
              setTimeout(() => {
                if (
                  sameColInput.select &&
                  typeof sameColInput.select === "function"
                ) {
                  sameColInput.select();
                }
              }, 0);
            } else {
              // إذا لم يوجد، ننتقل لأول حقل في الصف السابق
              focusFirstInRow(rowIndex - 1);
            }
          }
        }

        return;
      }

      // معالجة Tab و Enter (الكود الأصلي)
      if (key !== "Tab" && key !== "Enter") return;
      if (key === "Tab" && (event as any).shiftKey) return;

      // السماح بالتنقل دائماً حتى في الصفوف الفارغة (مثل سند قبض وصرف عملاء)
      // إذا كان hasValue false، نسمح بالتنقل الطبيعي للـ Tab و Enter
      if (!hasValue) {
        if (key === "Tab") {
          // نسمح بالتنقل الطبيعي للـ Tab حتى في الصفوف الفارغة
          return;
        } else if (key === "Enter") {
          // نسمح بالتنقل للـ Enter حتى في الصفوف الفارغة
          // لا نمنع التنقل، نستمر في التنقل الطبيعي
        }
      }

      if (key === "Enter") {
        event.preventDefault();

        if (!atLastCol) {
          const nextInRow = rowRefs[colIndex + 1];
          const nextCol = colIndex + 1;

          if (nextInRow) {
            focusNode(nextInRow);
          } else {
            // ✅ إذا لم يكن هناك ref، نبحث مباشرة عن combobox أولاً
            const combobox = findComboboxByCol(rowIndex, nextCol);

            if (combobox) {
              // ✅ إضافة tabIndex
              if (
                !combobox.hasAttribute("tabindex") ||
                combobox.getAttribute("tabindex") === "-1"
              ) {
                combobox.setAttribute("tabindex", "0");
              }
              combobox.focus();

              return;
            }

            // ✅ البحث باستخدام data-col
            const nextInput = document.querySelector(
              `input[data-row="${rowIndex}"][data-col="${nextCol}"]`,
            ) as HTMLInputElement;

            if (nextInput) {
              nextInput.focus();

              return;
            }

            // محاولة بعد تأخير
            setTimeout(() => {
              const nextRowRefs = inputRefs.current[rowIndex] || [];
              const nextInRowAfterDelay = nextRowRefs[colIndex + 1];

              if (nextInRowAfterDelay) {
                focusNode(nextInRowAfterDelay);
              } else {
                // ✅ محاولة أخيرة: البحث المباشر
                const comboboxAfterDelay = findComboboxByCol(rowIndex, nextCol);

                if (comboboxAfterDelay) {
                  // ✅ إضافة tabIndex
                  if (
                    !comboboxAfterDelay.hasAttribute("tabindex") ||
                    comboboxAfterDelay.getAttribute("tabindex") === "-1"
                  ) {
                    comboboxAfterDelay.setAttribute("tabindex", "0");
                  }
                  comboboxAfterDelay.focus();
                }
              }
            }, 50);
          }

          return;
        }

        // السماح بالتنقل حتى في الصفوف الفارغة
        // if (!hasValue) {
        //   return;
        // }

        if (!isLastRow) {
          focusFirstInRow(rowIndex + 1);

          return;
        }

        // إذا كان آخر صف وآخر عمود، نتحقق من onLastCell callback
        if (onLastCell) {
          onLastCell();

          return;
        }

        // إذا كان الصف فارغاً، نضيف صف جديد
        onAddRow();
        focusNextRowFirstCell(rowIndex + 1);

        return;
      }

      // Tab key
      if (!atLastCol) {
        // إذا لم نكن في آخر عمود، نسمح بالتنقل الطبيعي للـ Tab
        // لا نمنع التنقل الطبيعي للـ Tab
        return;
      }

      // إذا كنا في آخر عمود ولكن الصف فارغ، نسمح بالتنقل للصف التالي
      if (!hasValue && !isLastRow) {
        event.preventDefault();
        focusFirstInRow(rowIndex + 1);

        return;
      }

      // السماح بالتنقل حتى في الصفوف الفارغة
      // if (!hasValue) {
      //   return;
      // }

      event.preventDefault();
      if (!isLastRow) {
        focusFirstInRow(rowIndex + 1);

        return;
      }

      // إذا كان آخر صف وآخر عمود، نتحقق من onLastCell callback
      if (onLastCell) {
        onLastCell();

        return;
      }

      // إذا كان الصف فارغاً، نضيف صف جديد
      onAddRow();
      focusNextRowFirstCell(rowIndex + 1);
    },
    [
      focusFirstInRow,
      focusNextRowFirstCell,
      onAddRow,
      rowHasValue,
      rows,
      onLastCell,
    ],
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
