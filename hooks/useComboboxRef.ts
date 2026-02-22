import { useCallback } from "react";

/**
 * A hook to handle ref assignments for Combobox elements
 * (like react-select or AsyncCreatableSelect) that may render their internal
 * [role="combobox"] input asynchronously.
 */
export function useComboboxRef() {
  const getComboboxRef = useCallback(
    (refSetter: (el: HTMLInputElement | null) => void) => {
      return (el: HTMLElement | null) => {
        if (el) {
          // البحث عن combobox مباشرة
          const findAndSetRef = () => {
            const combobox = el.querySelector(
              '[role="combobox"]',
            ) as HTMLElement;

            if (combobox) {
              refSetter(combobox as unknown as HTMLInputElement);
              return true;
            }

            return false;
          };

          // محاولة فورية
          if (!findAndSetRef()) {
            // محاولة بعد requestAnimationFrame
            requestAnimationFrame(() => {
              if (!findAndSetRef()) {
                // محاولة بعد setTimeout
                setTimeout(() => {
                  findAndSetRef();
                }, 10);
              }
            });
          }

          // محاولات إضافية
          setTimeout(() => {
            findAndSetRef();
          }, 100);
        } else {
          refSetter(null);
        }
      };
    },
    [],
  );

  return getComboboxRef;
}
