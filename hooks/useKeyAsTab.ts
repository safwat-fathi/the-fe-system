import {
  useCallback,
  useMemo,
  type KeyboardEvent,
  type RefObject,
} from "react";

type KeyLike = string;

export interface UseKeyAsTabOptions {
  /**
   * Keyboard `event.key` values that should behave like the Tab key.
   * Examples: "Enter", "Space".
   */
  keys: KeyLike | KeyLike[];
  /**
   * Optional container that constrains the focus loop. When omitted, the whole document body is used.
   */
  containerRef?: RefObject<HTMLElement | null>;
  /**
   * Skip attaching the behavior altogether when true.
   */
  disabled?: boolean;
  /**
   * Custom selector for what counts as focusable. Defaults to common tabbable elements.
   */
  focusableSelector?: string;
  /**
   * Optional filter invoked per element; return false to remove the element from focus order.
   */
  filterElement?: (element: HTMLElement) => boolean;
  /**
   * Whether the focus should wrap from the last element back to the first (and vice versa).
   */
  wrap?: boolean;
  /**
   * Allow consumers to ignore certain events dynamically (e.g., keep Enter working inside textareas).
   */
  shouldIgnoreEvent?: (event: KeyboardEvent<HTMLElement>) => boolean;
  /**
   * Invoked when focus is about to exit the container (no more focusable nodes in the given direction).
   * Return true to indicate you handled focus transfer yourself.
   */
  onBoundaryFocus?: (direction: 1 | -1) => boolean | void;
}

export interface UseKeyAsTabResult {
  /**
   * Attach to `onKeyDown` for any focusable that should honor the alternate Tab key(s).
   */
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /**
   * Handle F4 key to toggle select dropdowns (open/close).
   * Attach to `onKeyDown` on select elements.
   */
  handleF4KeyForSelect: (
    event: KeyboardEvent<HTMLElement> | KeyboardEvent<Element>,
  ) => boolean;
}

const DEFAULT_FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  "area[href]",
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([type="hidden"]):not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'iframe:not([tabindex="-1"])',
  'summary:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const normalizeKey = (key: string): string => {
  if (key === " ") return "Space";

  const lower = key.toLowerCase();
  const keyMap: Record<string, string> = {
    space: "Space",
    spacebar: "Space",
    enter: "Enter",
    tab: "Tab",
    escape: "Escape",
    esc: "Escape",
  };

  return keyMap[lower] || key;
};

const isElementVisible = (element: HTMLElement) => {
  const visibilityChecker = (
    element as HTMLElement & {
      checkVisibility?: (options?: {
        checkOpacity?: boolean;
        checkVisibilityCSS?: boolean;
      }) => boolean;
    }
  ).checkVisibility;

  if (typeof visibilityChecker === "function") {
    try {
      return visibilityChecker.call(element, {
        checkOpacity: true,
        checkVisibilityCSS: true,
      });
    } catch {
      // fall back to style-based checks
    }
  }

  if (typeof window === "undefined") {
    return true;
  }

  const style = window.getComputedStyle(element);

  if (
    style.visibility === "hidden" ||
    style.display === "none" ||
    style.opacity === "0"
  ) {
    return false;
  }

  if (style.position === "fixed") {
    return true;
  }

  return Boolean(element.offsetParent);
};

const baseFilter = (element: HTMLElement) => {
  return (
    !element.hasAttribute("disabled") &&
    element.getAttribute("aria-hidden") !== "true" &&
    element.tabIndex >= 0 &&
    isElementVisible(element)
  );
};

export default function useKeyAsTab(
  options: UseKeyAsTabOptions,
): UseKeyAsTabResult {
  const {
    keys,
    containerRef,
    disabled = false,
    focusableSelector = DEFAULT_FOCUSABLE_SELECTOR,
    filterElement,
    wrap = false,
    shouldIgnoreEvent,
    onBoundaryFocus,
  } = options;

  const keySet = useMemo(() => {
    const input = Array.isArray(keys) ? keys : [keys];

    return new Set(input.map(normalizeKey));
  }, [keys]);

  const mergedFilter = useCallback(
    (element: HTMLElement) => {
      return baseFilter(element) && (typeof filterElement !== "function" || filterElement(element));
    },
    [filterElement],
  );

  const moveFocus = useCallback(
    (direction: 1 | -1, fallbackActiveElement?: HTMLElement | null) => {
      if (typeof document === "undefined") return false;

      const root = containerRef?.current ?? document.body;
      if (!root) return false;

      const candidates = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(mergedFilter);

      if (candidates.length === 0) return false;

      const activeElement =
        (fallbackActiveElement && candidates.includes(fallbackActiveElement) ? fallbackActiveElement : null) ||
        (document.activeElement instanceof HTMLElement && root.contains(document.activeElement)
          ? document.activeElement
          : null);

      let currentIndex = activeElement ? candidates.indexOf(activeElement) : -1;
      if (currentIndex === -1 && fallbackActiveElement) {
        currentIndex = candidates.indexOf(fallbackActiveElement);
      }

      let nextIndex =
        currentIndex === -1
          ? direction === 1
            ? 0
            : candidates.length - 1
          : currentIndex + direction;

      if (nextIndex < 0 || nextIndex >= candidates.length) {
        if (!wrap) {
          if (typeof onBoundaryFocus === "function" && onBoundaryFocus(direction)) {
            return true;
          }

          return false;
        }

        nextIndex = nextIndex < 0 ? candidates.length - 1 : 0;
      }

      const nextElement = candidates[nextIndex];
      if (!nextElement) return false;

      try {
        nextElement.focus();
        return true;
      } catch {
        return false;
      }
    },
    [containerRef, focusableSelector, mergedFilter, onBoundaryFocus, wrap],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (disabled) return;
      if (typeof shouldIgnoreEvent === "function" && shouldIgnoreEvent(event)) {
        return;
      }

      const normalized = normalizeKey(event.key);

      if (!keySet.has(normalized)) {
        return;
      }

      const direction: 1 | -1 = event.shiftKey ? -1 : 1;
      const fallbackElement =
        (event.target instanceof HTMLElement ? event.target : null) ||
        (event.currentTarget as HTMLElement | null);

      const moved = moveFocus(direction, fallbackElement);

      if (moved) {
        event.preventDefault();
      }
    },
    [disabled, keySet, moveFocus, shouldIgnoreEvent],
  );

  /**
   * Helper: البحث عن select button المرتبط بـ listbox
   */
  const findSelectButtonFromListbox = useCallback(
    (listboxElement: HTMLElement): HTMLElement | null => {
      const menuContainer = listboxElement.closest(".react-select__menu");
      const reactSelectContainer = menuContainer?.previousElementSibling;

      if (reactSelectContainer) {
        return reactSelectContainer.querySelector(
          '[role="combobox"]',
        ) as HTMLElement | null;
      }

      if (listboxElement.id) {
        const instanceId = listboxElement.id.replace("-listbox", "");
        const element = document.querySelector(`[id*="${instanceId}"]`);

        return element?.closest('[role="combobox"]') as HTMLElement | null;
      }

      return null;
    },
    [],
  );

  /**
   * Helper: البحث عن listbox وتركيز على أول عنصر
   */
  const focusFirstListboxItem = useCallback(
    (selectButton: HTMLElement) => {
      const listbox =
        selectButton
          .closest(".react-select__control")
          ?.nextElementSibling?.querySelector('[role="listbox"]') ||
        document.querySelector('[id*="-listbox"], [role="listbox"]');

      if (!listbox) return;

      const firstOption = listbox.querySelector('[role="option"]') as HTMLElement;
      const focusTarget = firstOption || (listbox.querySelector('input[type="text"]') as HTMLInputElement);

      if (focusTarget) {
        focusTarget.focus();
      }
    },
    [],
  );

  /**
   * Helper: إغلاق القائمة المفتوحة
   */
  const closeSelect = useCallback((selectButton: HTMLElement) => {
    const escapeEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      bubbles: true,
      cancelable: true,
    });

    selectButton.dispatchEvent(escapeEvent);

    // تأكيد الإغلاق
    setTimeout(() => {
      if (
        selectButton.getAttribute("aria-expanded") === "true" &&
        typeof selectButton.click === "function"
      ) {
        selectButton.click();
      }
    }, 50);
  }, []);

  /**
   * Helper: التحقق من أن هذا ليس SearchableSelect
   */
  const isSearchableSelect = useCallback(
    (element: HTMLElement | Element): boolean => {
      const htmlElement = element as HTMLElement;

      return !!(
        htmlElement.closest('[data-component="searchable-select"], .searchable-select-wrapper')
      );
    },
    [],
  );

  /**
   * Handle F4 key to toggle select dropdowns (open/close)
   * يعمل toggle: الضغط الأولى يفتح القائمة، الضغط الثانية يغلقها (حتى لو لم تختر شيئاً)
   */
  const handleF4KeyForSelect = useCallback(
    (event: KeyboardEvent<HTMLElement> | KeyboardEvent<Element>) => {
      if (event.key !== "F4") return false;

      const target = (event.target as HTMLElement | null) || (event.currentTarget as HTMLElement | null);

      if (!target) return false;

      // إذا كنا داخل listbox، نغلق القائمة
      const listboxElement = target.closest('[role="listbox"]') as HTMLElement | null;

      if (listboxElement) {
        event.preventDefault();
        event.stopPropagation();

        const selectButton = findSelectButtonFromListbox(listboxElement);

        if (selectButton?.click) {
          selectButton.click();
          setTimeout(() => selectButton.focus?.(), 50);
        }

        return true;
      }

      // إذا كنا على select button
      const selectButton = target.closest('[role="combobox"]') as HTMLElement;

      if (!selectButton) return false;

      // SearchableSelect يتعامل مع F4 داخلياً
      if (isSearchableSelect(selectButton)) return false;

      event.preventDefault();
      event.stopPropagation();

      const isExpanded = selectButton.getAttribute("aria-expanded") === "true";

      if (isExpanded) {
        closeSelect(selectButton);
      } else {
        selectButton.click();
        setTimeout(() => focusFirstListboxItem(selectButton), 150);
      }

      return true;
    },
    [findSelectButtonFromListbox, focusFirstListboxItem, closeSelect, isSearchableSelect],
  );

  return {
    handleKeyDown,
    handleF4KeyForSelect,
  };
}
