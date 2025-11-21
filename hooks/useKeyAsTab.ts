import { useCallback, useMemo, type KeyboardEvent, type RefObject } from "react";

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
  if (lower === "space" || lower === "spacebar") return "Space";
  if (lower === "enter") return "Enter";
  if (lower === "tab") return "Tab";
  if (lower === "escape" || lower === "esc") return "Escape";
  return key;
};

const isElementVisible = (element: HTMLElement) => {
  const visibilityChecker = (element as HTMLElement & {
    checkVisibility?: (options?: { checkOpacity?: boolean; checkVisibilityCSS?: boolean }) => boolean;
  }).checkVisibility;

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
  if (style.visibility === "hidden" || style.display === "none" || style.opacity === "0") {
    return false;
  }

  if (style.position === "fixed") {
    return true;
  }

  return Boolean(element.offsetParent);
};

const baseFilter = (element: HTMLElement) => {
  if (element.hasAttribute("disabled")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  if (element.tabIndex < 0) return false;

  return isElementVisible(element);
};

export default function useKeyAsTab(options: UseKeyAsTabOptions): UseKeyAsTabResult {
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
      if (!baseFilter(element)) return false;
      if (typeof filterElement === "function") {
        return filterElement(element);
      }
      return true;
    },
    [filterElement],
  );

  const moveFocus = useCallback(
    (direction: 1 | -1, fallbackActiveElement?: HTMLElement | null) => {
      if (typeof document === "undefined") return false;

      const root = containerRef?.current ?? document.body;
      if (!root) return false;

      const nodeList = root.querySelectorAll<HTMLElement>(focusableSelector);
      const candidates: HTMLElement[] = [];

      nodeList.forEach((node) => {
        if (mergedFilter(node)) {
          candidates.push(node);
        }
      });

      if (candidates.length === 0) {
        return false;
      }

      const activeElement =
        fallbackActiveElement && candidates.includes(fallbackActiveElement)
          ? fallbackActiveElement
          : document.activeElement instanceof HTMLElement && root.contains(document.activeElement)
            ? document.activeElement
            : null;

      let currentIndex = activeElement ? candidates.indexOf(activeElement) : -1;

      if (currentIndex === -1 && fallbackActiveElement) {
        currentIndex = candidates.indexOf(fallbackActiveElement);
      }

      let nextIndex =
        currentIndex === -1 ? (direction === 1 ? 0 : candidates.length - 1) : currentIndex + direction;

      if (nextIndex < 0 || nextIndex >= candidates.length) {
        if (!wrap) {
          if (direction === 1 && typeof onBoundaryFocus === "function") {
            const handled = onBoundaryFocus(direction);
            if (handled) return true;
          }
          if (direction === -1 && typeof onBoundaryFocus === "function") {
            const handled = onBoundaryFocus(direction);
            if (handled) return true;
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
			console.log(event.key);
			
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
        event.target instanceof HTMLElement
          ? event.target
          : ((event.currentTarget as HTMLElement | null) ?? null);
      const moved = moveFocus(direction, fallbackElement);

      if (moved) {
        event.preventDefault();
      }
    },
    [disabled, keySet, moveFocus, shouldIgnoreEvent],
  );

  return {
    handleKeyDown,
  };
}
