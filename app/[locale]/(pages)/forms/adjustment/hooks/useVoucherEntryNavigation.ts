"use client";

import { KeyboardEvent, useCallback } from "react";

import { VoucherDetail } from "@/types/voucher";

interface UseVoucherEntryNavigationProps {
  details: VoucherDetail[];
  addDetailRow: () => void;
  focusFirstInRow: (index: number) => void;
}

export const useVoucherEntryNavigation = ({
  details,
  addDetailRow,
  focusFirstInRow,
}: UseVoucherEntryNavigationProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      const target = e.target as HTMLElement | null;

      if (!target) return;

      const isInListbox = target.closest('[role="listbox"]');

      if (isInListbox) {
        return;
      }

      const selectButton = target.closest('[role="combobox"]');

      // Check if the target is an input or textarea that should trigger the action
      // For standard inputs/textareas without combobox role
      const isStandardInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // If it's a select (combobox)
      if (selectButton) {
        const isExpanded =
          selectButton.getAttribute("aria-expanded") === "true";

        // If menu is open, allow normal interaction
        if (isExpanded && e.key !== "Escape") {
          return;
        }

        if (e.key === "Enter" && !isExpanded) {
          executeNavigation(e);
        }

        if (e.key === "Escape") {
          return;
        }
      }
      // If it's a standard input/textarea
      else if (isStandardInput) {
        if (e.key === "Enter" && !e.shiftKey) {
          executeNavigation(e);
        }
      }

      function executeNavigation(event: KeyboardEvent<HTMLElement>) {
        event.preventDefault();
        event.stopPropagation();

        // ✅ Add new row if none exists
        if (details.length === 0) {
          addDetailRow();
        }

        // ✅ Robust function to focus the account field
        const focusToAccountField = (): boolean => {
          try {
            const accountSelectId = `#account-select-0`;
            let accountSelect = document.querySelector(accountSelectId);

            // ✅ If not found by ID, try finding by prefix
            if (!accountSelect) {
              const allSelects = document.querySelectorAll(
                '[id^="account-select-"]',
              );

              accountSelect = allSelects[0] || null;
            }

            if (!accountSelect) {
              return false;
            }

            // ✅ Search for combobox in various ways
            let combobox = accountSelect.querySelector(
              '[role="combobox"]',
            ) as HTMLElement;

            if (!combobox) {
              combobox = document.querySelector(
                `#account-select-0 [role="combobox"]`,
              ) as HTMLElement;
            }

            if (!combobox) {
              const allComboboxes =
                document.querySelectorAll('[role="combobox"]');

              for (let i = 0; i < allComboboxes.length; i += 1) {
                const cb = allComboboxes[i] as HTMLElement;
                const parent = cb.closest('[id^="account-select-"]');

                if (parent && parent.id === "account-select-0") {
                  combobox = cb;
                  break;
                }
              }
            }

            if (combobox) {
              combobox.focus();

              if (document.activeElement !== combobox) {
                combobox.setAttribute("tabindex", "0");
                combobox.focus();
              }

              return true;
            }

            return false;
          } catch (error) {
            console.error("Error in focusToAccountField:", error);

            return false;
          }
        };

        // ✅ Immediate attempt
        if (focusToAccountField()) {
          return;
        }

        // ✅ Retry logic
        requestAnimationFrame(() => {
          if (focusToAccountField()) return;

          setTimeout(() => {
            if (focusToAccountField()) return;

            setTimeout(() => {
              if (focusToAccountField()) return;

              setTimeout(() => {
                if (focusToAccountField()) return;
                focusFirstInRow(0);
              }, 100);
            }, 50);
          }, 10);
        });

        focusFirstInRow(0);

        // ✅ Additional retries
        [20, 80, 150, 250].forEach((delay) => {
          setTimeout(() => {
            focusFirstInRow(0);
            focusToAccountField();
          }, delay);
        });
      }
    },
    [details.length, addDetailRow, focusFirstInRow],
  );

  return { handleKeyDown };
};
