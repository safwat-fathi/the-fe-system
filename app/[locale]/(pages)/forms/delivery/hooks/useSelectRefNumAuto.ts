import { useEffect, useRef } from "react";

const useSelectRefNumAuto = (isEditing: boolean) => {
  const refNoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing) {
      const refNoInput = refNoInputRef.current;

      if (refNoInput && !refNoInput.disabled) {
        refNoInput.focus();
        refNoInput.select();
      }
    }
  }, [isEditing, refNoInputRef]);

  return refNoInputRef;
};

export default useSelectRefNumAuto;
