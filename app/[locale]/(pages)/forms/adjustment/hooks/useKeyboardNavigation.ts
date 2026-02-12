import {
  useCallback,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

interface FocusableElement {
  focus: () => void;
}

const useKeyboardNavigation = () => {
  const elementsRef = useRef<FocusableElement[]>([]);

  const register = useCallback(
    (index: number) => (el: FocusableElement | null) => {
      if (el) elementsRef.current[index] = el;
    },
    [],
  );

  const focusNext = useCallback((index: number) => {
    elementsRef.current[index + 1]?.focus();
  }, []);

  const handleEnter = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>, index: number) => {
      if (e.key === "Enter") {
        e.preventDefault();
        focusNext(index);
      }
    },
    [focusNext],
  );

  return { register, handleEnter };
};

export default useKeyboardNavigation;
