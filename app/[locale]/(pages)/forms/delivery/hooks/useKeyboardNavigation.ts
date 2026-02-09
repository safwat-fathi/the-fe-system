import { useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";

interface FocusableElement {
  focus: () => void;
}

const useKeyboardNavigation = () => {
  const elementsRef = useRef<FocusableElement[]>([]);

  const register = (index: number) => (el: FocusableElement | null) => {
    if (el) elementsRef.current[index] = el;
  };

  const focusNext = (index: number) => {
    elementsRef.current[index + 1]?.focus();
  };

  const handleEnter = (e: ReactKeyboardEvent<HTMLElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      focusNext(index);
    }
  };

  return { register, handleEnter };
};

export default useKeyboardNavigation;
