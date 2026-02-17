import { useEffect, useRef } from "react";

const useNavigationFelids = () => {
  const refNoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refNoInput.current?.focus();
  }, []);

  return {
    refNoInput,
  };
};

export default useNavigationFelids;
